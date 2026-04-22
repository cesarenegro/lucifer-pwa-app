import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealtime() {
  console.log("Fetching a node...");
  const { data: nodes } = await supabase.from('nodes').select('*').limit(1);
  if (!nodes || nodes.length === 0) return console.log("No nodes");
  
  const nodeId = nodes[0].id;
  const initiatorId = nodes[0].initiator_id;
  console.log(`Node ID: ${nodeId}, Initiator ID: ${initiatorId}`);

  let received = false;

  const channel = supabase
    .channel(`public:messages:node_id=eq.${nodeId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `node_id=eq.${nodeId}` },
      (payload) => {
        console.log("PAYLOAD RECEIVED:", payload.new);
        received = true;
      }
    )
    .subscribe(async (status) => {
      console.log("Subscription status:", status);
      if (status === 'SUBSCRIBED') {
        console.log("Inserting a test message...");
        const { data, error } = await supabase.from('messages').insert([{
          node_id: nodeId,
          sender_id: initiatorId,
          content: "Test realtime message"
        }]);
        if (error) console.error("Insert error:", error);
        
        // Wait a bit to see if payload arrives
        setTimeout(() => {
          if (!received) console.log("Did NOT receive realtime payload. Realtime is probably not enabled for the 'messages' table.");
          process.exit(0);
        }, 3000);
      }
    });
}

testRealtime();
