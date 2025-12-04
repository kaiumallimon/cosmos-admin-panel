import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { getCollection } from '@/lib/mongodb';
import { FewShotExample, UpdateFewShotExampleRequest } from '@/lib/agent-types';

// GET /api/few-shot-examples/[id] - Fetch a single few-shot example
async function getHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const fewShotExamplesCollection = await getCollection<FewShotExample>('few_shot_examples');
    const fewShotExample = await fewShotExamplesCollection.findOne({ id });
    
    if (!fewShotExample) {
      return NextResponse.json({ error: 'Few-shot example not found' }, { status: 404 });
    }

    return NextResponse.json(fewShotExample);
  } catch (error: any) {
    console.error('Error fetching few-shot example:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

// PUT /api/few-shot-examples/[id] - Update a few-shot example
async function putHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: UpdateFewShotExampleRequest = await req.json();

    const fewShotExamplesCollection = await getCollection<FewShotExample>('few_shot_examples');
    
    // Check if few-shot example exists
    const existingExample = await fewShotExamplesCollection.findOne({ id });
    if (!existingExample) {
      return NextResponse.json({ error: 'Few-shot example not found' }, { status: 404 });
    }

    // Validate expected_output if provided
    if (body.expected_output !== undefined) {
      if (typeof body.expected_output !== 'object' || body.expected_output === null) {
        return NextResponse.json({ 
          error: 'expected_output must be a valid object' 
        }, { status: 400 });
      }
    }

    // Update few-shot example
    const updateData = {
      ...body,
      updated_at: new Date()
    };

    const result = await fewShotExamplesCollection.updateOne(
      { id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Few-shot example not found' }, { status: 404 });
    }

    // Fetch updated few-shot example
    const updatedExample = await fewShotExamplesCollection.findOne({ id });
    
    return NextResponse.json({
      message: 'Few-shot example updated successfully',
      fewShotExample: updatedExample
    });

  } catch (error: any) {
    console.error('Error updating few-shot example:', error);
    return NextResponse.json({ error: 'Failed to update few-shot example: ' + error.message }, { status: 500 });
  }
}

// DELETE /api/few-shot-examples/[id] - Delete a few-shot example
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const fewShotExamplesCollection = await getCollection<FewShotExample>('few_shot_examples');

    const deleteResult = await fewShotExamplesCollection.deleteOne({ id });
    
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Few-shot example not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Few-shot example deleted successfully',
      deletedId: id
    });

  } catch (error: any) {
    console.error('Error deleting few-shot example:', error);
    return NextResponse.json({ error: 'Failed to delete few-shot example: ' + error.message }, { status: 500 });
  }
}

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 1];
  return getHandler(req, { params: Promise.resolve({ id }) });
});

export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 1];
  return putHandler(req, { params: Promise.resolve({ id }) });
});

export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 1];
  return deleteHandler(req, { params: Promise.resolve({ id }) });
});