import { NextRequest, NextResponse } from 'next/server';
import { deleteAISectionFromR2 } from '@/lib/cloudflare-r2';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    const deleted = await deleteAISectionFromR2(sectionId);

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete AI section file' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'AI section deleted',
    });
  } catch (error) {
    console.error('Error deleting AI section:', error);
    return NextResponse.json({ error: 'Failed to delete AI section' }, { status: 500 });
  }
}
