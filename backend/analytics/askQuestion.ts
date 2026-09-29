import { runPipeline } from './runPipeline'
import type { AskQuestionParams, AskQuestionResult } from './types'

export default async function askQuestion(req: { params: AskQuestionParams; user: User }): Promise<AskQuestionResult> {
  return runPipeline(req.params.question, req.params.conversation, req.user.fullName ?? req.user.email)
}
