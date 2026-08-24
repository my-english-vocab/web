import { QuizSession } from "@/app/quiz/QuizSession";
import { AuthGuard } from "@/components/AuthGuard";

export default async function QuizSessionPage({
  params,
}: PageProps<"/quiz/session/[selection]">) {
  const { selection } = await params;

  return (
    <AuthGuard>
      <QuizSession selection={selection} />
    </AuthGuard>
  );
}
