from stockmanagement.models import Stock, Item, Group

from rest_framework.response import Response
from rest_framework import viewsets
from collections import OrderedDict

class FormDataMixin(viewsets.ModelViewSet):
    @property
    def serializer_class(self):
        """Serializer for model type specified in model"""
        return NotImplemented

    @property
    def model(self):
        """Model to use for getting field data"""
        return NotImplemented

    @property
    def exclude(self):
        """Field to not include in fields data"""
        return []

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
            pk (number, optional): if update include primary key of stock to update. Defaults to None.

        Returns:
            Response: 201 if successful and 400 if unsuccessful
        """
        sizes = data.pop('size')
        item = Item.objects.get(pk=data.pop('item'))

        if pk is not None:
            instances = Stock.objects.filter(pk=pk)
            instances.update(**data, size=sizes.pop(0))

        Stock.objects.bulk_create([
            Stock(**data, item=item, is_instock=True, size=size) for size in sizes
        ])
    
        return Response(status=201)


    def should_cut(self, data):
        return self.can_cut and 'size' in data and isinstance(data['size'], list)
    

    def update(self, request, pk=None):
        data = request.data.copy()
        if self.should_cut(data):
            return self.bar_cut(data, pk=pk)

        return super().update(request)


    def create(self, request):
        data = request.data.copy()
        print(data)
        if self.should_cut(data):
            return self.bar_cut(data)

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
        fields = self.model._meta.get_fields()
        serializer = self.serializer_class(self.get_queryset(), many=True)
        field_data = [
            (field.name, self.get_field_type(field), self.compact_choices(field.choices)) for field in fields if field.name not in self.exclude
        ]
        related_data = [
            (name, self.get_indexed_data(data, serializer)) for name, data, serializer in self.get_related_data()
        ]

        return Response(OrderedDict([
            ('data', serializer.data),
            ('fields', field_data),
            *related_data,
        ]))