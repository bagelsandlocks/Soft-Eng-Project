export const handler = async (event) => {
  console.log('Default handler called with event:', JSON.stringify(event, null, 2));
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: JSON.stringify({
      status: 'success',
      message: 'ShopComp API is running',
      endpoints: [
        'POST /shopcomp/register_shopper',
        'POST /shopcomp/login_shopper',
        'POST /shopcomp/create_receipt',
        'POST /shopcomp/add_item',
        'POST /shopcomp/edit_item',
        'POST /shopcomp/remove_item',
        'POST /shopcomp/submit_receipt',
        'POST /shopcomp/analyze_receipt'
      ]
    })
  };
};