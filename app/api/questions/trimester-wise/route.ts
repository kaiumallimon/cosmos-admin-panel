import { supabase } from '@/lib/supabaseClient'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get('term') // exam_type, e.g. "final"
  const course_code = req.nextUrl.searchParams.get('course_code') // e.g. "CSE-1111"

  console.log("Received exam_type parameter:", term)
  console.log("Received course_code parameter:", course_code)

  // First, let's check what data exists in the question_parts table
  const { data: allData, error: allError } = await supabase
    .from('question_parts')
    .select('semester_term, short, exam_type, course_code')
    .limit(10)

  console.log("Sample data from question_parts:", allData, allError)

  // Build the query dynamically
  let query = supabase
    .from('question_parts')
    .select('semester_term, short, exam_type, course_code')

  // Apply filters if provided
  if (term) query = query.eq('exam_type', term)
  if (course_code) query = query.eq('course_code', course_code)

  const { data, error } = await query

  console.log("Fetched semester terms:", data, error)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Use only question_parts table data
  const combinedData = data || []

  // Filter out nulls and extract unique semester terms
  const uniqueTerms = [...new Set(combinedData.map(item => item.semester_term).filter(Boolean))]

  // Sort numerically descending (e.g., 20242 > 20241)
  const sortedTerms = uniqueTerms.sort((a, b) => Number(b) - Number(a))

  return NextResponse.json({
    semester_terms: sortedTerms,
    count: sortedTerms.length,
    debug: {
      question_parts_count: data?.length || 0,
      sample_data: allData?.slice(0, 3)
    }
  })
}
