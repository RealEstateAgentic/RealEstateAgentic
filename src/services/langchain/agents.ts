import { ChatOpenAI } from '@langchain/openai';
import { ConversationChain } from 'langchain/chains';
import { BufferWindowMemory } from 'langchain/memory';
import { PromptTemplate } from '@langchain/core/prompts';

function createLLM() {
  console.log('🔑 OpenAI API Key check:', {
    hasKey: !!process.env.OPENAI_API_KEY,
    keyLength: process.env.OPENAI_API_KEY?.length || 0,
    envKeys: Object.keys(process.env).filter(key => key.includes('OPENAI'))
  });
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not found in environment variables');
  }
  
  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
    modelName: 'gpt-4'
  });
}

const buyerQualificationPrompt = PromptTemplate.fromTemplate(`
You are an expert real estate assistant helping to qualify potential buyers. Your goal is to assess their readiness, financial capability, and motivation to purchase a home.

Focus on these key areas:
1. Financial Readiness (pre-approval status, down payment, credit score awareness)
2. Timeline and Urgency (when they want to buy, flexibility)
3. Motivation Level (why they're buying, life circumstances)
4. Budget and Preferences (price range, location, property type)
5. Financial Sophistication (understanding of the buying process)

Ask thoughtful, conversational questions that help uncover:
- True buying motivation and timeline
- Financial capacity and preparation level
- Realistic expectations about the market
- Potential obstacles or concerns

Current conversation:
{history}

Human: {input}
Assistant:`);

const sellerQualificationPrompt = PromptTemplate.fromTemplate(`
You are an expert real estate assistant helping to qualify potential sellers. Your goal is to assess their motivation, timeline, and readiness to sell their property.

Focus on these key areas:
1. Motivation Level (why selling, urgency, life circumstances)
2. Timeline and Flexibility (when they need to sell, move timeline)
3. Financial Readiness (mortgage status, equity, next home plans)
4. Property Knowledge (current value awareness, condition, improvements)
5. Market Understanding (realistic pricing expectations, selling process)

Ask thoughtful, conversational questions that help uncover:
- True selling motivation and urgency
- Realistic timeline and flexibility
- Financial situation and next steps
- Property condition and preparation needs
- Pricing expectations and market awareness

Current conversation:
{history}

Human: {input}
Assistant:`);

export class BuyerQualificationAgent {
  private chain: ConversationChain;

  constructor() {
    this.chain = new ConversationChain({
      llm: createLLM(),
      prompt: buyerQualificationPrompt,
      memory: new BufferWindowMemory({ k: 10 })
    });
  }

  async qualify(input: string): Promise<string> {
    try {
      const response = await this.chain.call({ input });
      return response.response;
    } catch (error) {
      console.error('Buyer qualification error:', error);
      throw new Error('Failed to process buyer qualification');
    }
  }

  async summarizeQualification(conversationHistory: string): Promise<string> {
    const summaryPrompt = `You are an expert real estate agent analyzing a potential buyer's qualification. Your summary will be sent to another agent who needs to immediately understand this buyer's potential and take action.

Based on the following buyer information, create a comprehensive, professional, and actionable summary:

${conversationHistory}

Write a detailed analysis that includes:

## BUYER QUALIFICATION SUMMARY

**Client:** [Name and contact info]

**FINANCIAL READINESS: [Score/10]**
- Pre-approval status and lender details
- Down payment amount and readiness
- Monthly payment comfort level
- Overall financial strength assessment

**MOTIVATION & TIMELINE: [High/Medium/Low - Immediate/3-6 months/6+ months]**
- Specific reasons for buying
- Urgency level and flexibility
- Timeline for purchase decision

**SEARCH PREFERENCES:**
- Preferred neighborhoods and reasons
- Areas to avoid and why
- Key property features and requirements

**COMMUNICATION & LOGISTICS:**
- Best contact method and availability
- Showing preferences and scheduling
- Level of involvement desired

**AGENT RECOMMENDATIONS:**
[Provide 3-4 specific, actionable next steps the agent should take immediately]

**POTENTIAL CONCERNS:**
[Any red flags or challenges to watch for]

**OVERALL ASSESSMENT:**
[2-3 sentences summarizing why this buyer is/isn't a strong lead and what the agent should focus on]

Write this as a professional memo that helps the agent understand exactly how to work with this buyer and what to prioritize. Be specific, actionable, and insightful.`;

    try {
      const llm = createLLM();
      const response = await llm.invoke(summaryPrompt);
      return String(response.content);
    } catch (error) {
      console.error('Buyer summary error:', error);
      throw new Error('Failed to generate buyer summary');
    }
  }
}

export class SellerQualificationAgent {
  private chain: ConversationChain;

  constructor() {
    this.chain = new ConversationChain({
      llm: createLLM(),
      prompt: sellerQualificationPrompt,
      memory: new BufferWindowMemory({ k: 10 })
    });
  }

  async qualify(input: string): Promise<string> {
    try {
      const response = await this.chain.call({ input });
      return response.response;
    } catch (error) {
      console.error('Seller qualification error:', error);
      throw new Error('Failed to process seller qualification');
    }
  }

  async summarizeQualification(conversationHistory: string): Promise<string> {
    const summaryPrompt = `You are an expert real estate agent analyzing a potential seller's qualification. Your summary will be sent to another agent who needs to immediately understand this seller's potential and take action.

Based on the following seller information, create a comprehensive, professional, and actionable summary:

${conversationHistory}

Write a detailed analysis that includes:

## SELLER QUALIFICATION SUMMARY

**Client:** [Name and contact info]

**MOTIVATION & URGENCY: [High/Medium/Low - Immediate/Flexible/Long-term]**
- Primary reasons for selling
- Timeline constraints and flexibility
- External pressure factors (job, family, financial)

**FINANCIAL POSITION:**
- Current mortgage status and equity estimate
- Expected sale price vs. market reality
- Next home plans and financial requirements

**PROPERTY READINESS:**
- Current condition and needed improvements
- Recent upgrades or renovations
- Preparation timeline and investment willingness

**MARKET EXPECTATIONS:**
- Pricing expectations vs. current market
- Understanding of selling process and timeline
- Flexibility on terms and conditions

**AGENT RECOMMENDATIONS:**
[Provide 3-4 specific, actionable next steps the agent should take immediately]

**POTENTIAL CONCERNS:**
[Any red flags, unrealistic expectations, or challenges to address]

**OVERALL ASSESSMENT:**
[2-3 sentences summarizing why this seller is/isn't a strong lead and what the agent should focus on]

Write this as a professional memo that helps the agent understand exactly how to work with this seller and what to prioritize. Be specific, actionable, and insightful.`;

    try {
      const llm = createLLM();
      const response = await llm.invoke(summaryPrompt);
      return String(response.content);
    } catch (error) {
      console.error('Seller summary error:', error);
      throw new Error('Failed to generate seller summary');
    }
  }
}

export const buyerAgent = new BuyerQualificationAgent();
export const sellerAgent = new SellerQualificationAgent();