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
        context['groups'] = Group.objects.order_by("id").values()
        context['items'] = Item.objects.order_by("id").annotate(
                                            group_name=F("group__name")
                                        ).values()

        for stock in stocks:
            if stock.is_instock:
                context['instock'].append(stock)
            else:
                context['outstock'].append(stock)

        return context

class AddData(LoginRequiredMixin, View):
    EDIT_MODELS = (
        ("groups-id", Group),
        ("items-id", Item),
        ("stocks-id", Stock),
    )

    def update_model(self, post):
        for model_id, model_class in self.EDIT_MODELS:
            if model_id in post and post[model_id]:
                return model_class.objects.get(id=post[model_id])
        return None


    def post(self, request, *args, **kwargs):
        # if self.request.is_ajax():
        post = request.POST.copy()
        form_name = post.pop("form-name")[0]
        form = None
        instance = self.update_model(post)
        print(instance)
        if form_name == "add-groups":
            form = GroupForm(post, instance=instance)
        elif form_name == "add-items":
            form = ItemForm(post, instance=instance)
        else:
            form = StockForm(post, instance=instance)
        print(form.is_valid())
        if form.is_valid():
            form.save()
        else:
            print(form.errors)

        return redirect('stockmanagement:stock_display')
