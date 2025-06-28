import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  options: QuizOption[];
}

interface QuizProps {
  questions: Question[];
  onComplete: (score: number) => void;
}

export const Quiz: React.FC<QuizProps> = ({ questions, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: string}>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  
  const currentQuestion = questions[currentQuestionIndex];
  
  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };
  
  const handleNextQuestion = () => {
    if (!currentQuestion || !selectedAnswers[currentQuestion.id]) {
      return;
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz completed
      calculateScore();
    }
  };
  
  const calculateScore = () => {
    let correct = 0;
    questions.forEach(question => {
      const selectedAnswerId = selectedAnswers[question.id];
      const correctOption = question.options.find(option => option.isCorrect);
      
      if (selectedAnswerId && correctOption && selectedAnswerId === correctOption.id) {
        correct++;
      }
    });
    
    const percentage = Math.round((correct / questions.length) * 100);
    setScore(percentage);
    setQuizCompleted(true);
    onComplete(percentage);
  };
  
  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizCompleted(false);
  };
  
  if (quizCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
          <CardDescription>You scored {score}% on this quiz</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-4">
            <div className={`text-4xl font-bold mb-2 ${score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
              {score}%
            </div>
            <div className="flex justify-center mb-4">
              {score >= 70 ? (
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  Passed
                </div>
              ) : (
                <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  Failed
                </div>
              )}
            </div>
            <p className="text-muted-foreground">
              {score >= 70 
                ? 'Congratulations! You passed the quiz.' 
                : 'You did not pass. 70% is required to pass.'}
            </p>
          </div>
          
          <div className="text-left mb-4">
            <p className="font-medium mb-2">Summary:</p>
            <p>
              <span className="font-medium">Correct answers:</span> {questions.filter(
                q => q.options.find(o => o.isCorrect)?.id === selectedAnswers[q.id]
              ).length} of {questions.length}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {score < 70 && (
            <Button variant="outline" onClick={restartQuiz}>
              Retry Quiz
            </Button>
          )}
          <Button onClick={() => onComplete(score)}>
            {score >= 70 ? 'Continue' : 'Close'}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
      </CardHeader>
      <CardContent>
        {currentQuestion && (
          <div className="py-4">
            <p className="font-medium mb-4">{currentQuestion.text}</p>
            
            <RadioGroup 
              value={selectedAnswers[currentQuestion.id]} 
              onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
            >
              <div className="space-y-3">
                {currentQuestion.options.map(option => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id}>{option.text}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleNextQuestion}
          disabled={!selectedAnswers[currentQuestion?.id]}
        >
          {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
        </Button>
      </CardFooter>
    </Card>
  );
};
