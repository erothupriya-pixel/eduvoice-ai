from rest_framework import serializers
from authentication.serializers import UserSerializer
from classrooms.serializers import ClassroomSerializer
from .models import (
    Lecture, 
    FlashcardSet, 
    Flashcard, 
    Quiz, 
    Question, 
    QuizSubmission, 
    QuizSubmissionItem,
    Document
)

class LectureSerializer(serializers.ModelSerializer):
    uploader = UserSerializer(read_only=True)
    classroom_detail = ClassroomSerializer(source='classroom', read_only=True)

    class Meta:
        model = Lecture
        fields = (
            'id', 'title', 'description', 'audio_file', 'document_file', 
            'file_type', 'transcript', 'summary', 'keywords', 'uploader', 
            'classroom', 'classroom_detail', 'status', 'created_at'
        )
        read_only_fields = ('id', 'transcript', 'summary', 'keywords', 'uploader', 'status', 'created_at')


class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ('id', 'front', 'back')


class FlashcardSetSerializer(serializers.ModelSerializer):
    cards = FlashcardSerializer(many=True, read_only=True)

    class Meta:
        model = FlashcardSet
        fields = ('id', 'lecture', 'title', 'cards', 'created_at')
        read_only_fields = ('id', 'created_at')


# Question serializer for taking the quiz (excludes correct answer to prevent cheating)
class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ('id', 'question_text', 'question_type', 'options')


# Question serializer with answers for grading / teacher views
class QuestionWithAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ('id', 'question_text', 'question_type', 'options', 'correct_answer')


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ('id', 'lecture', 'title', 'questions', 'created_at')
        read_only_fields = ('id', 'created_at')


class QuizSubmissionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizSubmissionItem
        fields = ('id', 'question', 'chosen_answer', 'is_correct')
        read_only_fields = ('id', 'is_correct')


class QuizSubmissionSerializer(serializers.ModelSerializer):
    items = QuizSubmissionItemSerializer(many=True, read_only=True)
    student = UserSerializer(read_only=True)
    
    # Input for submission: a list of {question_id, chosen_answer}
    answers = serializers.JSONField(write_only=True)

    class Meta:
        model = QuizSubmission
        fields = ('id', 'quiz', 'student', 'score', 'items', 'submitted_at', 'answers')
        read_only_fields = ('id', 'score', 'items', 'student', 'submitted_at')

    def create(self, validated_data):
        quiz = validated_data['quiz']
        student = self.context['request'].user
        answers_list = validated_data.pop('answers')

        # Retrieve all questions for the quiz
        questions = {q.id: q for q in quiz.questions.all()}
        
        correct_count = 0
        total_questions = len(questions)

        if total_questions == 0:
            raise serializers.ValidationError("This quiz does not have any questions.")

        submission = QuizSubmission.objects.create(
            quiz=quiz,
            student=student,
            score=0.0
        )

        for ans in answers_list:
            q_id = uuid_or_str = ans.get('question_id')
            chosen = ans.get('chosen_answer', '').strip()
            
            # Find matching question in quiz
            try:
                import uuid
                if isinstance(q_id, str):
                    q_id = uuid.UUID(q_id)
            except ValueError:
                continue

            if q_id in questions:
                question = questions[q_id]
                is_correct = (chosen.lower() == question.correct_answer.lower())
                if is_correct:
                    correct_count += 1
                
                QuizSubmissionItem.objects.create(
                    submission=submission,
                    question=question,
                    chosen_answer=chosen,
                    is_correct=is_correct
                )
        
        # Calculate percentage score
        score = (correct_count / total_questions) * 100.0
        submission.score = round(score, 2)
        submission.save()

        return submission

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['quiz'] = QuizSerializer(instance.quiz).data
        return rep


class DocumentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Document
        fields = (
            'id', 'user', 'file', 'original_filename', 'file_type', 
            'file_size', 'uploaded_at', 'processing_status', 'extracted_text'
        )
        read_only_fields = ('id', 'user', 'uploaded_at', 'processing_status', 'extracted_text')

