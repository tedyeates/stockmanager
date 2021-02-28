from django.shortcuts import render
from django.views.generic import ListView
from django.db.models import Count, F, ExpressionWrapper, DecimalField

from stockmanagement.models import Stock, Item


class StockDisplay(ListView):
    context_object_name = 'stock'
    template_name='stockmanagement/stock_display.html'
    model = Item

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        stocks = Stock.objects.annotate(total_price=ExpressionWrapper(
                                                    F('quantity') * F('price'), 
                                                    output_field=DecimalField())).select_related('item', 'item__group')


        context['metal_instock'] = []
        context['metal_outstock'] = []
        context['instock'] = []
        context['outstock'] = []
        for stock in stocks:
            if stock.is_instock and stock.is_metalstock:
                context['metal_instock'].append(stock)
            elif stock.is_instock:
                context['instock'].append(stock)
            elif stock.is_metalstock:
                context['metal_outstock'].append(stock)
            else:
                context['outstock'].append(stock)
        
        print(context['outstock'])
        return context
    

