from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first to get standard error response.
    response = exception_handler(exc, context)

    # If response is None, an unhandled server exception occurred (e.g. Database Error, 500 error)
    if response is None:
        logger.exception("Unhandled Exception in REST API View", exc_info=exc)
        return Response(
            {
                "detail": "An internal server error occurred.",
                "error": str(exc)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response
