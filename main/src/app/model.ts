// quick and dirty. Put everything into one class. Should separate

export class Shopper {
    username: string
    password: string
    shoppingList: Array<ShoppingList>
    reciept: Array<Receipt>
    storeChain: Array<storeChain>

    constructor () {
        this.username = ""
        this.password = ""
        this.shoppingList = []
        this.reciept = []
        this.storeChain = []
    }

}

export class ShoppingList {
    SL_ID: string
    items: Array<Item>

    constructor() {
        this.SL_ID = ""
        this.items = []
    }

}

export class storeChain {
    name: string
    stores: Array<Store>
    url: string

    constructor() {
        this.name = ""
        this.stores = []
        this.url = ""
    }

}

export class Item {
    name: string
    id: string
    price: number
    quantity: number
    category?: string

    constructor( name: string, id: string, price: number, quantity: number, category?: string ) {
        this.name = name
        this.id = id
        this.price = price
        this.quantity = quantity
        this.category = category
    }

}

export class Store {
    name: string
    items: Array<Item>
    url: string
    reciepts: Array<Receipt>

    constructor() {
        this.name = ""
        this.items = []
        this.url = ""
        this.reciepts = []
    }
    
}

export class Administrator {
    username: string
    password: string

    constructor() {
        this.username = ""
        this.password = ""
    }
}

export class Receipt {  
    receiptID: string
    shopper: string         // shopper username
    storeName: string
    storeChainName: string
    status: string           // "draft" | "submitted"
    items: Array<Item> = []

    constructor() {

        this.receiptID = ""
        this.shopper = ""
        this.storeName = ""
        this.storeChainName = ""
        this.status = ""
        this.items = []
    }

    
}
 






    // setUsername(username: string) {
    //     this.username = username
    // }

    // setPassword(password: string) {
    //     this.password = password
    // }

    // comparePassword(input: string) : boolean {
    //     return this.password === input;
    // }
