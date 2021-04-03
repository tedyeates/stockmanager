from django.shortcuts import render, redirect
from django.views.generic import ListView, View
from django.db.models import Count, F, ExpressionWrapper, DecimalField
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse

from stockmanagement.models import Stock, Item, Group
from stockmanagement.forms import StockForm, ItemForm, GroupForm
class StockDisplay(LoginRequiredMixin, ListView):
    context_object_name = 'stock'
    template_name='stockmanagement/stock_display.html'
    model = Item

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Adds total field which is quantity x price and preloads items and groups
        stocks = Stock.objects.annotate(total_price=ExpressionWrapper(
                                                    F('quantity') * F('price'), 
                                                    output_field=DecimalField())
                                        ).order_by('-date').select_related('item', 'item__group')
        print(stocks)
        # Forms for modal popup
        context['group_form'] = GroupForm
        context['item_form'] = ItemForm
        context['stock_form'] = StockForm

        context['instock'] = []
        context['outstock'] = []
        context['groups'] = Group.objects.all().values('name', 'description')
        context['items'] = Item.objects.annotate(
                                            group_name=F("group__name")
                                        ).all().values( "code", "name", "description", "item_type",
                                                        "size", "brand", "unit", "group_name")
        for stock in stocks:
            if stock.is_instock:
                context['instock'].append(stock)
            else:
                context['outstock'].append(stock)

        return context

class AddData(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        # if self.request.is_ajax():
        post = request.POST.copy()
        form_name = post.pop("form-name")[0]
        form = None
        if form_name == "add-group":
            form = GroupForm(post)
        elif form_name == "add-item":
            form = ItemForm(post)
        else:
            form = StockForm(post)

        if form.is_valid():
            form.save()
        
        return redirect('stockmanagement:stock_display')
