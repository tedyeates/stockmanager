from django.shortcuts import render
from django.views import View
from django.http import HttpResponse

class HomeView(View):
    def get(self, request, *args, **kwargs):
        return HttpResponse('Home GET request!')


class AboutView(View):
    def get(self, request, *args, **kwargs):
        return HttpResponse('About A request!')
