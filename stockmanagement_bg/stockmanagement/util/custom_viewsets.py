import csv
from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
from rest_framework import views, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from django.db.models.signals import pre_save
from functools import partial
from django.utils.functional import cached_property

class FormDataMixin(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,) 
    order_by ="-modified"
    
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
        return self.model.objects.all().order_by(self.order_by)
    
    def list(self, request):
        """Gets model, field and related data based on model endpoint requested from
        
        Returns:
            Response: HTTP Response containing model, field and related data
        """
        queryset = self.filter_queryset(self.get_queryset())
        self.data = self.paginate_queryset(queryset)
        return self.get_paginated_response(self.view_serialized_data)
    
    @action(detail=False)
    def export(self, request):
        self.data = self.filter_queryset(self.get_queryset())
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

        return Response(field_data)
    
    