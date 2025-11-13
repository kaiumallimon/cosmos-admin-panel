import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
    try{
        const response = await supabase.from('agents').select('*');
    }catch(err){
        return NextResponse.json({ error: 'Internal server error: ' + (err as Error).message }, { status: 500 });   
    }
}