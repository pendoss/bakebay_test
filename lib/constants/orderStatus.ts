export const ORDER_STATUS_LABELS: Record<string, string> = {
  ordering: "Оформляется",
  processing: "В обработке",
  payed: "Оплачен",
  processed: "Обработан",
  in_progress: "Готовится",
  delivering: "Доставляется",
  delivered: "Доставлен",
}

export const ORDER_STATUS_VARIANTS: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
  ordering: "outline",
  processing: "outline",
  payed: "secondary",
  processed: "secondary",
  in_progress: "secondary",
  delivering: "default",
  delivered: "default",
}
