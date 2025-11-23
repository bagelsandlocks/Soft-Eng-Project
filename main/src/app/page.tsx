'use client'                              // directive to clarify client-side. Place at top of ALL .tsx files
import React from 'react'
import { instance } from './aws'          // centralize access to instance
import axios from "axios"
import { Shopper } from './model'
import { Receipt } from './model'
import { Item } from './model'

/******************************Register and login********************************************* */
function LoginRegister() {
  // Login and Registration Use Cases
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [conpassword, setConPassword] = React.useState("");
  const [registerOutput, setRegisterOutput] = React.useState<any>(null);

  const [logusername, setLogUsername] = React.useState("");
  const [logpassword, setLogPassword] = React.useState("");
  const [loginOutput, setLoginOutput] = React.useState<any>(null);


  async function createShopper() {
    if(password !== conpassword){
      alert("Passwords do not match!");
      return;
    }
    try {
      const response = await instance.post("/register_shopper", {
        username: username,
        password: password,
      });
      setRegisterOutput(response.data);
    } catch (err:any) {
      setRegisterOutput({ error: err.message });
    }
  }

  async function loginShopper() {
    try {
      const response = await instance.post('/login_shopper', {
        username: logusername,
        password: logpassword,
      });
      const body = JSON.parse(response.data.body);
    // Store shopperID and token in localStorage as the global variables
    localStorage.setItem("shopperID", body.shopperID);
    localStorage.setItem("token", body.token);
    
      setLoginOutput(body);
    } catch (err:any) {
      setLoginOutput({ error: err.message });
    }
  }

  return (
    <div>
      <h1>Shopper Login Page</h1>
      <>Shopper Register</><br />
      <input placeholder="username" onChange={e=>setUsername(e.target.value)} /><br />
      <input placeholder="password" onChange={e=>setPassword(e.target.value)} /><br />
      <input placeholder="confirm password" onChange={e=>setConPassword(e.target.value)} /><br />
      <button onClick={createShopper}>Register</button><br />
      <pre>{registerOutput && JSON.stringify(registerOutput, null, 2)}</pre><br />
      <>Shopper Login</><br />
      <input placeholder="username" onChange={e=>setLogUsername(e.target.value)} /><br />
      <input placeholder="password" onChange={e=>setLogPassword(e.target.value)} /><br />
      <button onClick={loginShopper}>Login</button><br />
      <pre>{loginOutput && JSON.stringify(loginOutput, null, 2)}</pre>
    </div>  
  )
}


/******************************ItemList********************************************* */
function ItemList(props: { items: Array<Item>, onRemove: (id: string) => void, onEdit: (item: Item) => void }) {
  if (props.items.length === 0) {
    return <div>Loading...</div>;
  }
  let items = props.items as Array<Item>;


  return (
    <div>
      <h2>Items in Receipt</h2>
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {item.id}:{item.name} - ${item.price} x {item.quantity}
            <button onClick={() => props.onRemove(item.id)}>Remove</button>
            <button onClick={() => props.onEdit(item)}>Edit</button>
          </li>          
        ))}
      </ul>

    </div>
  );
}

function retrieveItems(
  receiptID: string,
  setItems: (items: Array<Item>) => void
) {
    const shopperID = localStorage.getItem("shopperID");
    const token = localStorage.getItem("token");
    instance.post('list_items', 
      { 
        receiptID,
        shopperID,
        token
    })
    .then(response => {
      let status = response.data.statusCode;

      if (status === 200) {
        let vals = JSON.parse(response.data.body);

        let ret: Array<Item> = vals.items.map((i:any) =>
          new Item(i.name, i.id, i.price, i.quantity, i.category)
        );

        setItems(ret);
      }
    })
    .catch(error => {
      console.error("Error retrieving items:", error);
      setItems([]);
    });
}

/******************************Receipt********************************************* */
function ReceiptDisplay() {
  const [items, setItems] = React.useState<Array<Item>>([]);
  const [itemName, setItemName] = React.useState("");
  const [itemID, setItemID] = React.useState("");
  const [itemPrice, setItemPrice] = React.useState(0);
  const [quantity, setQuantity] = React.useState(0);
  const [receipt, setReceipt] = React.useState<Receipt | null>(null);
  const [category, setCategory] = React.useState("");
    // NEW RECEIPT FIELDS
  const [date, setDate] = React.useState("");
  const [storeChain, setStoreChain] = React.useState("");
  const [store, setStore] = React.useState("");
  const [receiptName, setReceiptName] = React.useState("");


  const receiptID = receipt?.receiptID ?? "";

  function createReceipt() {
    const shopperID = localStorage.getItem("shopperID");
    const token = localStorage.getItem("token");
    instance.post('/create_receipt', {
      shopperID,
      token,
      date,
      storeChain,
      store,
      receiptName

    })
      .then(response => {
        const body = JSON.parse(response.data.body);
        if (response.data.statusCode === 200) {
          alert("Receipt created!");
        }
        setReceipt(body);   
        setItems([]);
      })
      .catch(error => console.error("Error creating receipt:", error));
  }


  React.useEffect(() => {
    if (receiptID) {
      retrieveItems(receiptID, setItems);
    }
  }, [receiptID]);

  // remove & edit & add Item 
  function addItem() {
    if (!receiptID) {
      alert("Create a receipt first!");
      return;
    }
    const shopperID = localStorage.getItem("shopperID");
    const token = localStorage.getItem("token");
    instance.post('/add_item', {
      shopperID,
      token,
      receiptID,
      receiptName,
      name: itemName,
      id: itemID,
      price: itemPrice,
      quantity: quantity,
      category: category
    })
    .then(response => {
      if (response.data.statusCode === 200) {
        retrieveItems(receiptID, setItems);
      }
    })
    .catch(error => console.error("Error adding item:", error));
  }


  function removeItem(itemID: string) {
    if (!receiptID) {
      alert("Create a receipt first!");
      return;
    }
    const shopperID = localStorage.getItem("shopperID");
    const token = localStorage.getItem("token");
    instance.post('/remove_item', {
      shopperID,
      token,
      receiptID,
      receiptName,
      itemID // removed itemID
    })
    .then(response => {
      if (response.data.statusCode === 200) {
        retrieveItems(receiptID, setItems);
      }
    })
    .catch(error => console.error("Error removing item:", error));
  }

  function editItem(item: Item) {
    if (!receiptID) {
      alert("Create a receipt first!");
      return;
    }
    const shopperID = localStorage.getItem("shopperID");
    const token = localStorage.getItem("token");
    instance.post('/edit_item', {
      shopperID,
      token,
      receiptID,
      receiptName,
      itemID: item.id, 
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      category: item.category
    })
    .then(response => {
      if (response.data.statusCode === 200) {
        retrieveItems(receiptID, setItems);
      }
    })
    .catch(error => console.error("Error editing item:", error));
  }


  //submit & analyze receipt
  function submitReceipt() {
    if (!receiptID) {
      alert("Create a receipt first!");
      return;
    }
    const shopperID = localStorage.getItem("shopperID");
    const token = localStorage.getItem("token");
    instance.post("/submit_receipt", { receiptID, receiptName, shopperID, token})
    .then(res => {
      if (res.data.statusCode === 200) {
        alert("Receipt submitted!");
      }
    })
  }

  function analyzeReceipt() {
    if (!receiptID) {
      alert("Create a receipt first!");
      return;
    }
    const shopperID = localStorage.getItem("shopperID");
    const token = localStorage.getItem("token");
    instance.post("/analyze_receipt", { receiptID, receiptName, shopperID, token})
      .then(res => {
        if (res.data.statusCode === 200) {
          alert("Receipt analyzed!");
        }
      })
  }

  return (
    <div>
      <h1>Receipt Dashboard</h1>

      <input type="date" onChange={e => setDate(e.target.value)} /><br />
      <input placeholder="Store Chain" onChange={e => setStoreChain(e.target.value)} /><br />
      <input placeholder="Store" onChange={e => setStore(e.target.value)} /><br />
      <input placeholder="Receipt Name" onChange={e => setReceiptName(e.target.value)} /><br />
      <button onClick={createReceipt}>Create Receipt</button><br /><br />

      <input placeholder="item name" disabled={!receiptID} onChange={e => setItemName(e.target.value)}  /><br/>
      <input placeholder="item price" type="number" disabled={!receiptID} onChange={e => setItemPrice(Number(e.target.value))} /><br/>
      <input placeholder="item quantity" type="number" disabled={!receiptID} onChange={e => setQuantity(Number(e.target.value))} /><br/>
      <input placeholder="item ID" disabled={!receiptID} onChange={e => setItemID(e.target.value)} /><br/>
      <input placeholder="item category" disabled={!receiptID} onChange={e => setCategory(e.target.value)} /><br/>
      

      <button onClick={addItem} disabled={!receiptID}>Add Item</button>


      <ItemList items={items}
       onRemove={removeItem} onEdit={(item) => {
          const newName = prompt("New name", item.name) ?? item.name;
          const newPrice = Number(prompt("New price", item.price.toString()) ?? item.price);
          const newQty = Number(prompt("New quantity", item.quantity.toString()) ?? item.quantity);

          let updated = new Item(newName, item.id, newPrice, newQty, item.category);
          editItem(updated);
        }}
   />
      <button onClick={submitReceipt} disabled={!receiptID}>Submit Receipt</button><br />
      <button onClick={analyzeReceipt} disabled={!receiptID}>Analyze Receipt</button>
    </div>
  );
}

/***************************************Reciept List****************************** */

/**************************************Account Dashboard************************** */


/************************************************************************************ */
/******************************Home Page********************************************* */
export default function Home() {
  return(
    <div>
      <LoginRegister />
      <ReceiptDisplay />
    </div>    
    )
}
