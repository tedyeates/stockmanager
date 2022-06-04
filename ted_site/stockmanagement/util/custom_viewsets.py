from stockmanagement.models import Instock, Outstock, Stock, Item, Group

from rest_framework.response import Response
from rest_framework import views, viewsets
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from collections import OrderedDict

from django.utils import timezone


class FormDataMixin(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,) 

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
    def can_cut(self):
        """Field to not include in fields data"""
        return False


    def get_related_data(self):
        """For returning data associated with selected API model
        e.g Items for Stock
        """
        return []

    def bar_cut(self, data, pk=None):
        """Save stock item and cut stock if multiple sizes specified
        Allows bars and sheets to be cut into multiple pieces and saved seperately

        Args:
            data (dict): Contains user entered data to be turned into stock model(s)
            pk (int, optional): if update include primary key of stock to update. Defaults to None.

        Returns:
            Response: 201 if successful and 400 if unsuccessful
        """
        sizes = data.pop('size')
        item = Item.objects.get(pk=data.pop('item'))

        if pk is not None:
            instances = Stock.objects.filter(pk=pk)
            instances.update(**data, modified=timezone.now(), size=sizes.pop(0))

        Stock.objects.bulk_create([
            Stock(**data, item=item, size=size) for size in sizes
        ])
    
        return Response(status=201)


    def should_cut(self, data):
        """Check if item is cuttable and has multiple sizes for the new items 

        Args:
            data (dict): Request data that should include size attribute
        Returns:
            bool: Whether requested item should be cut
        """

        return self.can_cut and 'size' in data and isinstance(data['size'][0], list)
    
    def related_object_to_id(self, request, model):
        for key in self.related_keys:
            if(key in request.data):
                print(key)
                request.data[key] = request.data[key]["id"]


    def update(self, request, pk=None):
        self.related_object_to_id(request, self.model)
        return super().update(request)


    def create(self, request):
        self.related_object_to_id(request, self.model)
        return super().create(request)


    def get_indexed_data(self, data, serializer):
        return OrderedDict([
            (model.pk, serializer(model).data) for model in data
        ])
    
    
    def get_field_type(self, field):
        if field.choices:
            return 'ChoiceField'
        return field.get_internal_type()


    def compact_choices(self, choices):
        if choices:
            return [choice[0] for choice in choices]
        return None
         

    def list(self, request):
        """Gets model, field and related data based on model endpoint requested from
        
        Returns:
            Response: HTTP Response containing model, field and related data
        """

        page = self.paginate_queryset(self.get_queryset())

        serializer = self.view_serializer_class(page, many=True)
        return self.get_paginated_response(serializer.data)
            


class FieldViewMixin(views.APIView):
    permission_classes = (IsAuthenticated,) 
    
    model = None
    exclude = None

    def get_field_type(self, field):
        print(field)
        if field.choices:
            return 'ChoiceField'
        return field.get_internal_type()


    def compact_choices(self, choices):
        if choices:
            return [choice[0] for choice in choices]
        return None


    def get(self, request, format=None):
        fields = self.model._meta.get_fields()
        field_data = [
            (field.name, self.get_field_type(field), self.compact_choices(field.choices)) for field in fields if field.name not in self.exclude
        ]
        return Response(field_data)