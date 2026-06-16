const url = "https://ursuwvnrbmgwgqlzltnk.supabase.co";
const key = "sb_publishable_AXaWKCyYyExHTN6x-E1Gng_6_55xr5w";

async function run() {
  const response = await fetch(`${url}/rest/v1/users?select=*`, {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`
    }
  });
  console.log(`Status: ${response.status}`);
  const data = await response.json();
  console.log('Users in DB:', JSON.stringify(data, null, 2));
}

run().catch(console.error);
