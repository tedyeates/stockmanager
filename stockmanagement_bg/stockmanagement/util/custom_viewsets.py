import csv
from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
from rest_framework import views, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from django.db.models.signals import pre_save
from functools import partial
from auditlog.middleware import threadlocal, AuditlogMiddleware
from auditlog.models import LogEntry
from django.utils.functional import cached_property


class DRFDjangoAuditModelMixin:
    """
    Mixin to integrate django-auditlog with Django Rest Framework.

    This is needed because DRF does not perform the authentication at middleware layer
    instead it performs the authentication at View layer.

    This mixin adds behavior to connect/disconnect the signals needed by django-auditlog to auto
    log changes on models.
    It assumes that AuditlogMiddleware is activated in settings.MIDDLEWARE_CLASSES
    """

    def should_connect_signals(self, request):
        """Determines if the signals should be connected for the incoming request."""
        # By default only makes sense to audit when the user is authenticated
        return request.user.is_authenticated

    def initial(self, request, *args, **kwargs):
        """Overwritten to use django-auditlog if needed."""
        super().initial(request, *args, **kwargs)

        if self.should_connect_signals(request):
            set_actor = partial(AuditlogMiddleware.set_actor, user=request.user,
                              signal_duid=threadlocal.auditlog['signal_duid'])
            pre_save.connect(set_actor, sender=LogEntry,
                             dispatch_uid=threadlocal.auditlog['signal_duid'], weak=False)

    def finalize_response(self, request, response, *args, **kwargs):
        """Overwritten to cleanup django-auditlog if needed."""
        response = super().finalize_response(request, response, *args, **kwargs)

        if hasattr(threadlocal, 'auditlog'):
            pre_save.disconnect(sender=LogEntry, dispatch_uid=threadlocal.auditlog['signal_duid'])
        return response


class FormDataMixin(DRFDjangoAuditModelMixin, viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,) 
    order_by ="-modified"
    exclude_from_filters = ["page", "pagination"]
    
    @property
    def serializer_class(self):
        """Serializer for model type specified in model"""
        return NotImplemented
    
    @property
    def related_keys(self):
        return []

    @property
    def view_serializer_class(self):
        """Serializer for model type specified in model"""
        return self.serializer_class
    
    @property
    def export_serializer_class(self):
        """Serializer for model type specified in model"""
        return self.serializer_class

    @property
    def can_cut(self):
        """Field to not include in fields data"""
        return False
    
    @cached_property
    def filters(self):
        filters = self.request.GET.copy()
        for param in self.exclude_from_filters:
            if param in filters:
                filters.pop(param)

        return filters.dict()
    
    
    @cached_property
    def view_serialized_data(self):
        return self.view_serializer_class(self.data, many=True).data
    
    @cached_property
    def export_serialized_data(self):
        return self.export_serializer_class(self.data, many=True).data
     
     
    @cached_property
    def count(self):
        if self.data is not None:
            return self.data.count()
        return ValueError("No data to count")

    def related_object_to_id(self, request):
        for key in self.related_keys:
            if(key in request.data and request.data[key] is not None):
                request.data[key] = request.data[key]["id"]


    def update(self, request, pk=None):
        self.related_object_to_id(request)
        return super().update(request)


    def create(self, request):
        self.related_object_to_id(request)
        return super().create(request)
    
    
    def get_field_type(self, field):
        if field.choices:
            return 'ChoiceField'
        return field.get_internal_type()


    def compact_choices(self, choices):
        if choices:
            return [choice[0] for choice in choices]
        return None
         

    def get_queryset(self):
        query = self.model.objects.filter(**self.filters)
        if self.order_by is not None:
            query = query.order_by("-modified")
            
        return query
    
        
    def list(self, request):
        """Gets model, field and related data based on model endpoint requested from
        
        Returns:
            Response: HTTP Response containing model, field and related data
        """

        self.data = self.paginate_queryset(self.get_queryset())
        return self.get_paginated_response(self.view_serialized_data)
    
    
    @action(detail=False)
    def export(self, request):
        self.data = self.get_queryset()
        filename = f"{self.model._meta.verbose_name}.csv"
        response = HttpResponse(
            content_type="text/csv",
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )
        
        headers = list(self.export_serialized_data[0].keys())
        writer = csv.writer(response)
        writer.writerow(headers)
        for data in self.export_serialized_data:
            writer.writerow([data[header] for header in headers])
        
        return response
        
            


class FieldViewMixin(views.APIView):
    permission_classes = (IsAuthenticated,) 
    
    model = None
    exclude = None

    def get_field_type(self, field):
        if getattr(field, "choices", None):
            return 'ChoiceField'
        return field.get_internal_type()


    def compact_choices(self, choices):
        if choices:
            return [choice[0] for choice in choices]
        return None


    def get(self, request, format=None):
        fields = self.model._meta.get_fields()
        field_data = []
        for field in fields:
            field_type = self.get_field_type(field)
            if field.name not in self.exclude:
                field_type = self.get_field_type(field)
                field_choices = self.compact_choices(getattr(field, "choices", None))
                field_data.append({
                    "fieldName": field.name, "fieldType": field_type, 
                    "fieldChoices": field_choices
                })
        print(field_data)
        return Response(field_data)
    
    