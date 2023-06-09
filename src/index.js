const desktop = require('./desktop');

let task_data = {
    Webhook: 'https://discord.com/api/webhooks/844746024538996787/tphQXNE-E-20nBNnKgNKQusjdlfyR5goYYhN3wFIcPBuV-K4-Gqbsv7mN2BuHYrWx7ac',
    Input: '0120522800188',
    TaskIdentifier: 'Test-Task',
    InputType: 'SKU',
    Quantity: '1',
    Size: 'Random',
    Delay: 1000,
    Proxy: undefined,
    Profile: {
        ProfileName: 'Test Profile',
        Email: 'test@example.com',
        Phone: '3239124222',
        ShippingFirst: 'John', 
        ShippingLast: 'Doe', 
        ShippingLine1: '450 Serra Mall', 
        ShippingLine2: '', 
        ShippingCity: 'Stanford', 
        ShippingState: 'CA',
        ShippingPostal: '94305', 
        ShippingCountry: 'US',
        BillingFirst: 'John',
        BillingLast: 'Doe',
        BillingLine1: '450 Serra Mall',
        BillingLine2: '',
        BillingCity: 'Stanford',
        BillingState: 'CA',
        BillingPostal: '94305',
        BillingCountry: 'US',
        CardHolder: 'John Doe',
        CardType: 'Visa',
        CardNumber: '4916871601864456',
        CardExpirationMonth: '10',
        CardExpirationYear: '2026',
        CardCVN: '424',
    }
}

new desktop.desktop(JSON.stringify(task_data)).initializeTask();