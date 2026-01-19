from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from django.contrib.auth.models import User

from login.serializers import UserSerializer

class TokenAuthentication(ObtainAuthToken):

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as error:
            return Response(error.detail, status=401)

        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'username': user.username,
        })


class SignUp(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
