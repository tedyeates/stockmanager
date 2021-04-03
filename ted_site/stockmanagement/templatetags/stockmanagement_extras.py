from django import template

register = template.Library()

@register.filter
def beautify_string(value):
    return value.replace("_", " ").title()