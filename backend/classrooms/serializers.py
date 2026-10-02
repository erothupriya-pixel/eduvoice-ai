from rest_framework import serializers
from authentication.serializers import UserSerializer
from .models import Classroom, Enrollment

class ClassroomSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    student_count = serializers.IntegerField(source='enrollments.count', read_only=True)

    class Meta:
        model = Classroom
        fields = ('id', 'name', 'description', 'teacher', 'invite_code', 'student_count', 'created_at')
        read_only_fields = ('id', 'invite_code', 'created_at')


class JoinClassroomSerializer(serializers.Serializer):
    invite_code = serializers.CharField(max_length=10, write_only=True)

    def validate_invite_code(self, value):
        value = value.upper().strip()
        try:
            classroom = Classroom.objects.get(invite_code=value)
        except Classroom.DoesNotExist:
            raise serializers.ValidationError("Invalid classroom invite code.")
        return classroom

    def create(self, validated_data):
        classroom = validated_data['invite_code']
        student = self.context['request'].user
        
        enrollment, created = Enrollment.objects.get_or_create(
            student=student,
            classroom=classroom
        )
        return enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    classroom = ClassroomSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ('id', 'student', 'classroom', 'enrolled_at')
