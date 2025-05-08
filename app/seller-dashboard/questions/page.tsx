"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

// Define Question type
interface Question {
  id: number;
  customer: {
    name: string;
    initials: string;
  };
  product: string;
  question: string;
  date: Date;
  status: string;
  answer?: string;
  answerDate?: Date;
}

// Пример данных
const initialQuestions: Question[] = [
  {
    id: 1,
    customer: { name: "Сара Уилсон", initials: "СУ" },
    product: "Шоколадный торт",
    question: "Подходит ли этот торт для человека с аллергией на орехи?",
    date: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 часа назад
    status: "Без ответа",
  },
  {
    id: 2,
    customer: { name: "Михаил Браун", initials: "МБ" },
    product: "Ассорти макарон",
    question: "Как долго эти макароны остаются свежими?",
    date: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 часов назад
    status: "Без ответа",
  },
  {
    id: 3,
    customer: { name: "Эмили Дэвис", initials: "ЭД" },
    product: "Клубничный чизкейк",
    question: "Могу ли я заказать этот чизкейк меньшего размера?",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 день назад
    status: "Отвечен",
    answer: "Да, мы предлагаем мини-версию (10 см) наших чизкейков. Вы можете выбрать опцию размера при заказе.",
    answerDate: new Date(Date.now() - 1000 * 60 * 60 * 22), // 22 часа назад
  },
  {
    id: 4,
    customer: { name: "Джеймс Уилсон", initials: "ДУ" },
    product: "Веганское шоколадное печенье",
    question: "Производятся ли эти печенья на предприятии, где также обрабатываются молочные продукты?",
    date: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 дня назад
    status: "Отвечен",
    answer:
      "Наше веганское печенье изготавливается в отдельной зоне нашей кухни, но на нашем предприятии обрабатываются молочные продукты. Мы принимаем меры для предотвращения перекрестного загрязнения, но не можем гарантировать, что они на 100% свободны от следов.",
    answerDate: new Date(Date.now() - 1000 * 60 * 60 * 30), // 30 часов назад
  },
  {
    id: 5,
    customer: { name: "Оливия Джонсон", initials: "ОД" },
    product: "Тирамису в стаканчике",
    question: "Какой кофе вы используете в вашем тирамису?",
    date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 дня назад
    status: "Отвечен",
    answer: "Мы используем премиальный итальянский эспрессо в нашем тирамису для аутентичного вкусового профиля.",
    answerDate: new Date(Date.now() - 1000 * 60 * 60 * 45), // 45 часов назад
  },
]

export default function QuestionsPage() {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [answerText, setAnswerText] = useState("")
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)

  const handleAnswer = (questionId: number): void => {
    if (!answerText.trim()) return

    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              status: "Отвечен",
              answer: answerText,
              answerDate: new Date(),
            }
          : q,
      ),
    )

    setAnswerText("")
    setSelectedQuestion(null)

    toast({
      title: "Ответ отправлен",
      description: "Ваш ответ был отправлен клиенту.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Вопросы клиентов</h2>
        <p className="text-muted-foreground">Отвечайте на вопросы клиентов о ваших товарах</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="grid gap-2 w-full sm:max-w-[360px]">
          <Input placeholder="Поиск вопросов по товару или клиенту..." />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="all" className="flex-1 sm:flex-auto">
            Все вопросы
          </TabsTrigger>
          <TabsTrigger value="unanswered" className="flex-1 sm:flex-auto">
            Без ответа
          </TabsTrigger>
          <TabsTrigger value="answered" className="flex-1 sm:flex-auto">
            Отвеченные
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onAnswer={() => setSelectedQuestion(question)}
              selectedQuestion={selectedQuestion}
              answerText={answerText}
              setAnswerText={setAnswerText}
              handleAnswer={handleAnswer}
            />
          ))}
        </TabsContent>

        <TabsContent value="unanswered" className="mt-4 space-y-4">
          {questions
            .filter((q) => q.status === "Без ответа")
            .map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onAnswer={() => setSelectedQuestion(question)}
                selectedQuestion={selectedQuestion}
                answerText={answerText}
                setAnswerText={setAnswerText}
                handleAnswer={handleAnswer}
              />
            ))}
        </TabsContent>

        <TabsContent value="answered" className="mt-4 space-y-4">
          {questions
            .filter((q) => q.status === "Отвечен")
            .map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onAnswer={() => setSelectedQuestion(question)}
                selectedQuestion={selectedQuestion}
                answerText={answerText}
                setAnswerText={setAnswerText}
                handleAnswer={handleAnswer}
              />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface QuestionCardProps {
  question: Question,
  onAnswer: () => void,
  selectedQuestion: Question | null,
  answerText: string,
  setAnswerText: (text: string) => void,
  handleAnswer: (questionId: number) => void,
}
function QuestionCard({ question, onAnswer, selectedQuestion, answerText, setAnswerText, handleAnswer } : QuestionCardProps) {
  const isSelected = selectedQuestion && selectedQuestion.id === question.id

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={`/placeholder.svg?text=${question.customer.initials}`} alt={question.customer.name} />
              <AvatarFallback>{question.customer.initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{question.customer.name}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(question.date, { addSuffix: true, locale: ru })}
              </div>
            </div>
          </div>
          <Badge variant={question.status === "Без ответа" ? "outline" : "default"}>{question.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Товар: {question.product}</h4>
          <div className="border rounded-lg p-3 bg-muted/50">
            <p className="text-sm">{question.question}</p>
          </div>
        </div>

        {question.status === "Отвечен" && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Ваш ответ:</h4>
            <div className="border rounded-lg p-3">
              <p className="text-sm">{question.answer}</p>
              {question.answerDate ? (
                <p className="text-xs text-muted-foreground mt-2">
                  Отвечено {formatDistanceToNow(question.answerDate, { addSuffix: true, locale: ru })}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  Ответ не отправлен
                </p>
              )}

            </div>
          </div>
        )}

        {question.status === "Без ответа" && !isSelected && (
          <Button size="sm" onClick={onAnswer}>
            Ответить на вопрос
          </Button>
        )}

        {isSelected && (
          <div className="space-y-3">
            <Textarea
              placeholder="Введите ваш ответ здесь..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleAnswer(question.id)}>
                Отправить ответ
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAnswerText("")}>
                Очистить
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
