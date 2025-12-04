import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { Agent, AgentTool, AgentConfiguration, FewShotExample } from '@/lib/agent-types';

// GET /api/agents/stats - Get agent statistics
async function getHandler(req: AuthenticatedRequest) {
  try {
    const agentsCollection = await getCollection<Agent>('agents');
    const agentToolsCollection = await getCollection<AgentTool>('agent_tools');
    const agentConfigurationsCollection = await getCollection<AgentConfiguration>('agent_configurations');
    const fewShotExamplesCollection = await getCollection<FewShotExample>('few_shot_examples');

    // Get basic counts
    const totalAgents = await agentsCollection.countDocuments({});
    const activeAgents = await agentsCollection.countDocuments({ is_active: true });
    const inactiveAgents = await agentsCollection.countDocuments({ is_active: false });
    
    const totalTools = await agentToolsCollection.countDocuments({});
    const enabledTools = await agentToolsCollection.countDocuments({ is_enabled: true });
    const disabledTools = await agentToolsCollection.countDocuments({ is_enabled: false });
    
    const totalConfigurations = await agentConfigurationsCollection.countDocuments({});
    
    const totalExamples = await fewShotExamplesCollection.countDocuments({});
    const activeExamples = await fewShotExamplesCollection.countDocuments({ is_active: true });
    const inactiveExamples = await fewShotExamplesCollection.countDocuments({ is_active: false });

    // Get agent distribution by example types
    const exampleTypeDistribution = await fewShotExamplesCollection.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: "$example_type", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Get agents with their tool and example counts
    const agentDetails = await agentsCollection.aggregate([
      {
        $lookup: {
          from: 'agent_tools',
          localField: 'id',
          foreignField: 'agent_id',
          as: 'tools'
        }
      },
      {
        $lookup: {
          from: 'few_shot_examples',
          localField: 'name',
          foreignField: 'agent_name',
          as: 'examples'
        }
      },
      {
        $lookup: {
          from: 'agent_configurations',
          localField: 'id',
          foreignField: 'agent_id',
          as: 'configurations'
        }
      },
      {
        $project: {
          id: 1,
          name: 1,
          display_name: 1,
          is_active: 1,
          created_at: 1,
          toolCount: { $size: "$tools" },
          exampleCount: { $size: "$examples" },
          configurationCount: { $size: "$configurations" },
          enabledToolCount: {
            $size: {
              $filter: {
                input: "$tools",
                cond: { $eq: ["$$this.is_enabled", true] }
              }
            }
          },
          activeExampleCount: {
            $size: {
              $filter: {
                input: "$examples",
                cond: { $eq: ["$$this.is_active", true] }
              }
            }
          }
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();

    const stats = {
      overview: {
        totalAgents,
        activeAgents,
        inactiveAgents,
        totalTools,
        enabledTools,
        disabledTools,
        totalConfigurations,
        totalExamples,
        activeExamples,
        inactiveExamples
      },
      exampleTypeDistribution,
      agentDetails,
      generatedAt: new Date()
    };

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error('Error fetching agent stats:', error);
    return NextResponse.json({ error: 'Failed to fetch agent stats: ' + error.message }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);