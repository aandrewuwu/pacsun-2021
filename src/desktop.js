const got = require('got');
const tough = require('tough-cookie');
const formdata = require('form-data');
const cheerio = require('cheerio');
const tunnel = require('tunnel');

class pacsunDesktop {
    constructor(taskData) {
        this.taskData = JSON.parse(taskData);
        this.cookieJar = new tough.CookieJar();
        this.taskData.Stopped = false;
        this.taskData.productDetails = {};
        this.taskData.Analytics = {};
        this.taskData.Analytics.taskTotalTime = +new Date();
        this.taskData.Analytics.fetchServerInformationAttempts = 0;
        this.taskData.Analytics.searchForProductAttempts = 0;
        this.taskData.Analytics.cartProductAttempts = 0;
        this.taskData.Analytics.startCheckoutAttempts = 0;
        this.taskData.Analytics.fetchAkamaiCookieAttempts = 0;
        this.taskData.Analytics.submitDetailsAttempts = 0;
        this.taskData.Analytics.submitCheckoutAttempts = 0;
        if (this.taskData.Proxy) {
            this.taskData.Agent = {
                https: tunnel.httpsOverHttp({
                    proxy: {
                        host: this.taskData.Proxy.split(':')[0],
                        port: this.taskData.Proxy.split(':')[1],
                        proxyAuth: this.taskData.Proxy.split(':')[2] + ':' + this.taskData.Proxy.split(':')[3]
                    }
                })
            }
        }
    } async outputInfo(level, infoMessage) {
        console.log(`[${new Date().toISOString().replace(/T/, ' ').replace(/Z/, '')}] [Task ${this.taskData.TaskIdentifier}] - ${level}: ${infoMessage}`);
    }
     async sleepTask(Ms) {
        return new Promise(resolve => setTimeout(resolve, Ms));
    } async searchForProduct() {
        try {
            if (this.taskData.InputType != 'SKU' && this.taskData.InputType != 'Link') return;
            this.productCodes = {
                'XXSmall': 9000,
                'XSmall': 9100,
                'Small': 9200,
                'Medium': 9300,
                'Large': 9400,
                'XLarge': 9500,
            }
            if (this.taskData.InputType == 'Link') {
                if (this.taskData.Input.indexOf('https://') > -1) {
                    // TODO: Add link support
                }
            }
            if (this.taskData.Size == 'XXSmall') {
                this.taskData.productDetails.productSize = this.taskData.Size;
                this.taskData.sizeCode = this.productCodes.XXSmall;
            } if (this.taskData.Size == 'XSmall') {
                this.taskData.productDetails.productSize = this.taskData.Size;
                this.taskData.sizeCode = this.productCodes.XSmall;
            } if (this.taskData.Size == 'Small') {
                this.taskData.productDetails.productSize = this.taskData.Size;
                this.taskData.sizeCode = this.productCodes.Small;   
            } if (this.taskData.Size == 'Medium') {
                this.taskData.productDetails.productSize = this.taskData.Size;
                this.taskData.sizeCode = this.productCodes.Medium;
            } if (this.taskData.Size == 'Large') {
                this.taskData.productDetails.productSize = this.taskData.Size;
                this.taskData.sizeCode = this.productCodes.Large;
            } if (this.taskData.Size == 'XLarge') {
                this.taskData.productDetails.productSize = this.taskData.Size;
                this.taskData.sizeCode = this.productCodes.XLarge;
            } if (this.taskData.Size == 'Random') {
                this.productCodesArray = Object.keys(this.productCodes);
                this.randomPick = Math.floor(Math.random() * this.productCodesArray.length);
                this.taskData.sizeCode = this.productCodes[this.productCodesArray[this.randomPick]];
                this.taskData.productDetails.productSize = Object.getOwnPropertyNames(this.productCodes)[this.randomPick];
                delete this.randomPick;
                delete this.productCodesArray;
            }
            this.taskData.Analytics.searchForProductAttempts++;
            this.outputInfo("Info", `Searching for product (${this.taskData.Analytics.searchForProductAttempts})`);
            this.headers = {
                'accept': 'text/html, */*; q=0.01',
                'accept-language': 'en-US,en;q=0.9,fr;q=0.8',
                'cache-control': 'max-age=0',
                'referer': `https://www.pacsun.com/${this.taskData.Input}.html`,
                'sec-ch-ua-mobile': '?0',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36',
                'x-requested-with': 'XMLHttpRequest',
            }
            this.response = await got.get(`on/demandware.store/Sites-pacsun-Site/default/Product-Variation?pid=${this.taskData.Input}&dwvar_${this.taskData.Input}_size=${this.taskData.sizeCode}&dwvar_${this.taskData.Input}_color=${this.taskData.productDetails.productColorCode}&format=ajax`, {
                cookieJar: this.cookieJar,
                headers: this.headers,
                agent: this.taskData.Agent,
                prefixUrl: 'https://www.pacsun.com',
                timeout: 15000,
            });
            this.statuscode = this.response.statusCode;
            if (this.statuscode == 200) {
                this.body = this.response.body;
                if (!this.taskData.productDetails.productName || !this.taskData.productDetails.productSize || !this.taskData.productDetails.productPrice || !this.taskData.productDetails.productPrice || !this.taskData.productDetails.productImage || !this.taskData.productDetails.productVariant) {
                    this.productName = this.body.split(`<h1 class="rwd-pdp-name dms-bold"`)[1].split(`">`)[1].split(`</h1>`)[0];
                    this.productImage = this.body.split(`<div class="rwd-pdp-image">\n<img src="`)[1].split('"')[0];
                    this.productColor = this.body.split(`<div class="rwd-swatch-value"`)[1].split('">')[1].split('\nColor:')[1].split('\n</div>')[0].trim();
                    this.productPrice = this.body.split(`<div class="usd-price"`)[1].split(`">`)[1].split('</div>')[0];
                    this.productVariant = this.body.split(`name="pid" id="pid" value="`)[1].split(`"/>`)[0];
                    this.productColorCode = this.body.split(`class="rwd-swatch-value" data-default-id="`)[1].split('"/>')[0].split(`">`)[0];
                    if (this.productVariant == this.taskData.Input) {
                        this.taskData.productDetails.productColorCode = this.productColorCode;
                        delete this.productColorCode;
                        delete this.productVariant;
                        delete this.productPrice;
                        delete this.productColor;
                        delete this.productImage;
                        delete this.productName;
                        delete this.body;
                        delete this.statuscode;
                        delete this.response;
                        delete this.headers;
                        delete this.productCodes;
                        if (this.taskData.Analytics.searchForProductAttempts >= 2) {
                            this.outputInfo("Info", "Size or Variant not found");
                            await this.sleepTask(this.taskData.Delay);
                        }
                        return await this.searchForProduct();
                    }
                    this.taskData.productDetails.productName = this.productName;
                    this.taskData.productDetails.productImage = this.productImage;
                    this.taskData.productDetails.productColor = this.productColor;
                    this.taskData.productDetails.productPrice = '$' + this.productPrice;
                    this.taskData.productDetails.productVariant = this.productVariant;
                    delete this.productVariant;
                    delete this.productPrice;
                    delete this.productColor;
                    delete this.productImage;
                    delete this.productName;
                    delete this.body;
                    delete this.statuscode;
                    delete this.response;
                    delete this.headers;
                    delete this.productCodes;
                    this.outputInfo("Info", `Found product - ${this.taskData.productDetails.productName} - ${this.taskData.productDetails.productSize}`);
                }
            }
        } catch (exception) {
            delete this.statuscode;
            delete this.headers;
            delete this.response;
            if (exception.response) if (exception.response) delete exception.response.body;
            this.name = exception.name;
            if (this.name == 'RequestError') {
                this.code = exception.code;
                if (this.code == 'ECONNRESET' || this.code == 'ETIMEDOUT') {
                    delete this.name;
                    delete this.code;
                    this.message = exception.message;
                    if (this.message == 'tunneling socket could not be established, statusCode=407') {
                        delete this.name;
                        delete this.code;
                        delete this.message;
                        this.outputInfo("Error", "Searching for product (Proxy authentication required)");
                        await this.sleepTask(this.taskData.Delay);
                        return await this.searchForProduct();
                    }
                    delete this.message;
                    this.outputInfo("Error", `Searching for product (Connection error) (${this.taskData.Analytics.searchForProductAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.searchForProduct();
                }
                delete this.name;
                delete this.code;
                this.outputInfo("Error", `Searching for product (Request error) (${this.taskData.Analytics.searchForProductAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.searchForProduct();
            } else if (this.name == 'TimeoutError') {
                delete this.name;
                this.outputInfo("Error", `Searching for product (Timed out) (${this.taskData.Analytics.searchForProductAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.searchForProduct();
            } else if (this.name == 'HTTPError') {
                delete this.name;
                this.statuscode = exception.response.statusCode;
                if (this.statuscode) {
                    this.responseheaders = exception.response.headers;
                    this.setcookieheader = this.responseheaders['set-cookie'];
                    if (!this.setcookieheader) {
                        delete exception.response.request;
                        delete exception.response.headers;
                        delete this.statuscode;
                        delete this.responseheaders;
                        delete this.setcookieheader;
                        this.outputInfo("Error", `Searching for product (Timed out) (${this.taskData.Analytics.searchForProductAttempts})`);
                        await this.sleepTask(this.taskData.Delay);
                        return await this.searchForProduct();
                    }
                    this.statusmessage = exception.response.statusMessage;
                    this.outputInfo("Error", `Searching for product (${this.statuscode} ${this.statusmessage}) (${this.taskData.Analytics.searchForProductAttempts})`);
                    delete this.statusmessage;
                    delete this.statuscode;
                    delete this.responseheaders;
                    delete this.setcookieheader;
                    await this.sleepTask(this.taskData.Delay);
                    return await this.searchForProduct();
                } else {
                    this.outputInfo("Error", `Searching for product (Unforeseeable error) (${this.taskData.Analytics.searchForProductAttempts})`)
                    await this.sleepTask(this.taskData.Delay);
                    return await this.searchForProduct();
                }
            } else {
                delete this.name;
                this.outputInfo("Error", `Searching for product (Unforeseeable error) (${this.taskData.Analytics.searchForProductAttempts})`)
                await this.sleepTask(this.taskData.Delay);
                return await this.searchForProduct();
            }
        }
    } async fetchAkamaiCookie() {
        try {
            this.taskData.Analytics.fetchAkamaiCookieAttempts++;
            this.outputInfo("Info", `Fetching Akamai Cookie (${this.taskData.Analytics.fetchAkamaiCookieAttempts})`);
            this.headers = {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
            }
            this.response = await got.get('akamai/fetch-abck', {
                headers: this.headers,
                prefixUrl: '',
                timeout: 15000,
            });
            this.statuscode = this.response.statusCode;
            if (this.statuscode == 200) {
                this.body = this.response.body;
                this.cookieJar.setCookieSync(this.body, 'https://www.pacsun.com');
                delete this.headers;
                delete this.response;
                delete this.statuscode;
                delete this.body;
            } else {
                delete this.headers;
                delete this.response;
                delete this.statuscode;
            }
        } catch (exception) {
            delete this.headers;
            delete this.response;
            delete this.statuscode;
            this.name = exception.name;
            if (this.name == 'RequestError') {
                this.code = exception.code;
                if (this.code == 'ECONNRESET' || this.code == 'ETIMEDOUT') {
                    delete this.name;
                    delete this.code;
                    this.outputInfo("Error", `Fetching Akamai cookie (Connection error) (${this.taskData.Analytics.fetchAkamaiCookieAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.fetchAkamaiCookie();
                }
                delete this.name;
                delete this.code;
                this.outputInfo("Error", `Fetching Akamai cookie (Request error) (${this.taskData.Analytics.fetchAkamaiCookieAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.fetchAkamaiCookie();
            } else if (this.name == 'TimeoutError') {
                delete this.name;
                this.outputInfo("Error", `Fetching Akamai cookie (Timed out) (${this.taskData.Analytics.fetchAkamaiCookieAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.fetchAkamaiCookie();
            } else if (this.name == 'HTTPError') {
                delete this.name;
                this.statuscode = exception.response.statusCode;
                if (this.statuscode) {
                    this.statusmessage = exception.response.statusMessage;
                    this.outputInfo("Error", `Fetching Akamai cookie (${this.statuscode} ${this.statusmessage}) (${this.taskData.Analytics.fetchAkamaiCookieAttempts})`)
                    delete this.statuscode;
                    delete this.statusmessage;
                    await this.sleepTask(this.taskData.Delay);
                    return await this.fetchAkamaiCookie();          
                } else {
                    delete this.name;
                    this.outputInfo("Error", `Fetching Akamai cookie (Unforeseeable error) (${this.taskData.Analytics.fetchAkamaiCookieAttempts})`)
                    await this.sleepTask(this.taskData.Delay);
                    return await this.fetchAkamaiCookie();
                }
            } else {
                delete this.name;
                this.outputInfo("Error", `Fetching Akamai cookie (Unforeseeable error) (${this.taskData.Analytics.fetchAkamaiCookieAttempts})`)
                await this.sleepTask(this.taskData.Delay);
                return await this.fetchAkamaiCookie();
            }
        }
    } async cartProduct() {
        try {
            this.taskData.Analytics.cartProductAttempts++;
            if (this.taskData.InputType == 'Variant') this.taskData.productDetails.productVariant = this.taskData.Input;
            this.outputInfo("Info", `Carting product (${this.taskData.Analytics.cartProductAttempts})`);
            this.form = new formdata();
            this.form.append('cartAction', 'add');
            this.form.append('Quantity', this.taskData.Quantity);
            this.form.append('pid', this.taskData.productDetails.productVariant);
            this.headers = {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'max-age=0',
                'origin': 'https://www.pacsun.com',
                'referer': `https://www.pacsun.com/${this.taskData.input}.html`,
                'sec-ch-ua-mobile': '?0',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36',
                'x-requested-with': 'XMLHttpRequest',
            }
            this.response = await got.post('on/demandware.store/Sites-pacsun-Site/default/Cart-AddProduct?format=ajax', {
                cookieJar: this.cookieJar,
                headers: this.headers,
                body: this.form,
                agent: this.taskData.Agent,
                prefixUrl: 'https://www.pacsun.com',
                timeout: 15000,
            });
            this.statuscode = this.response.statusCode;
            if (this.statuscode == 200) {
                this.body = this.response.body;
                this.$ = cheerio.load(this.body);
                this.cartQty = parseInt(this.$('span.minicart-quantity').text());
                if (this.cartQty > 0) {
                    if (!this.taskData.productDetails.productName || !this.taskData.productDetails.productSize || !this.taskData.productDetails.productPrice || !this.taskData.productDetails.productPrice || !this.taskData.productDetails.productImage) {
                        this.productName = this.$('div.mini-cart-name').attr('data-name');
                        this.productSize = this.$('span.value.Size').text().trim();
                        this.productImage = this.$('div.mini-cart-image img').attr('src');
                        this.productColor = this.$('span.value.Color').text().trim();
                        this.productPrice = this.$('div.mini-cart-subtotals span.value').text().trim();
    
                        this.taskData.productDetails.productName = this.productName;
                        this.taskData.productDetails.productSize = this.productSize;
                        this.taskData.productDetails.productImage = this.productImage;
                        this.taskData.productDetails.productColor = this.productColor;
                        this.taskData.productDetails.productPrice = this.productPrice;
                        
                        this.outputInfo("Info", `Found product - ${this.taskData.productDetails.productName} - ${this.taskData.productDetails.productSize}`);
    
                        delete this.productName;
                        delete this.productSize;
                        delete this.productImage;
                        delete this.productColor;
                        delete this.productPrice;
                        delete this.form;
                        delete this.headers;
                        delete this.response;
                        delete this.statuscode;
                        delete this.body;
                        delete this.$;
                        delete this.cartQty;
                    }
                } else {
                    delete this.form;
                    delete this.headers;
                    delete this.response;
                    delete this.statuscode;
                    delete this.body;
                    delete this.$;
                    delete this.cartQty;
                    this.outputInfo("Info", `Waiting for product (${this.taskData.Analytics.cartProductAttempts})`)
                    await this.sleepTask(this.taskData.Delay);
                    return await this.cartProduct();
                }
            } else {
                delete this.form;
                delete this.headers;
                delete this.response;
                await this.sleepTask(this.taskData.delay);
                return await this.cartProduct();
            }
        } catch (exception) {
            delete this.statuscode;
            delete this.form;
            delete this.headers;
            delete this.response;
            if (exception.response) if (exception.response) delete exception.response.body;
            this.name = exception.name;
            if (this.name == 'RequestError') {
                this.code = exception.code;
                if (this.code == 'ECONNRESET' || this.code == 'ETIMEDOUT') {
                    delete this.name;
                    delete this.code;
                    this.outputInfo("Error", `Carting product (Connection error) (${this.taskData.Analytics.cartProductAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.cartProduct();
                }
                this.message = exception.message;
                if (this.message == 'tunneling socket could not be established, statusCode=407') {
                    delete this.name;
                    delete this.code;
                    delete this.message;
                    this.outputInfo("Error", `Carting product (Proxy authentication required) (${this.taskData.Analytics.cartProductAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.cartProduct();
                }
                delete this.message;
                delete this.name;
                delete this.code;
                this.outputInfo("Error", `Carting product (Request error) (${this.taskData.Analytics.cartProductAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.cartProduct();
            } else if (this.name == 'TimeoutError') {
                delete this.name;
                this.outputInfo("Error", `Carting product (Timed out) (${this.taskData.Analytics.cartProductAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.cartProduct();
            } else if (this.name == 'HTTPError') {
                delete this.name;
                this.statuscode = exception.response.statusCode;
                if (this.statuscode) {
                    this.responseheaders = exception.response.headers;
                    this.setcookieheader = this.responseheaders['set-cookie'];
                    if (!this.setcookieheader) {
                        delete exception.response.request;
                        delete exception.response.headers;
                        delete this.statuscode;
                        delete this.responseheaders;
                        delete this.setcookieheader;
                        this.outputInfo("Error", `Carting product (Akamai banned) (${this.taskData.Analytics.cartProductAttempts})`);
                        await this.sleepTask(this.taskData.Delay);
                        return await this.cartProduct();
                    }
                    for (this.cookie of this.setcookieheader) {
                        if (this.cookie.indexOf('_abck') > -1) {
                            delete exception.response.request;
                            delete exception.response.headers;
                            delete this.statuscode;
                            delete this.responseheaders;
                            delete this.setcookieheader;
                            await this.fetchAkamaiCookie();
                            await this.sleepTask(this.taskData.Delay);
                            return await this.cartProduct();
                        }
                    }
                    this.statusmessage = exception.response.statusMessage;
                    this.outputInfo("Error", `Carting product (${this.statuscode} ${this.statusmessage}) (${this.taskData.Analytics.cartProductAttempts})`);
                    delete this.statusmessage;
                    delete this.statuscode;
                    delete this.responseheaders;
                    delete this.setcookieheader;
                    await this.sleepTask(this.taskData.Delay);
                    return await this.cartProduct();
                } else {
                    this.outputInfo("Error", `Carting product (Unforeseeable error) (${this.taskData.Analytics.cartProductAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.cartProduct();
                }
            } else {
                delete this.name;
                this.outputInfo("Error", `Carting product (Unforeseeable error) (${this.taskData.Analytics.cartProductAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.cartProduct();
            }
        }
    } async startCheckout() {
        try {
            this.taskData.Analytics.startCheckoutAttempts++;
            this.outputInfo("Info", `Starting checkout (${this.taskData.Analytics.startCheckoutAttempts})`);
            this.headers = {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'max-age=0',
                'origin': 'https://www.pacsun.com',
                'referer': `https://www.pacsun.com/${this.taskData.Input}.html`,
                'sec-ch-ua-mobile': '?0',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36',
            }
            this.response = await got.get('on/demandware.store/Sites-pacsun-Site/default/COCheckout-Start', {
                headers: this.headers,
                cookieJar: this.cookieJar,
                agent: this.taskData.Agent,
                prefixUrl: 'https://www.pacsun.com',
                timeout: 15000,
            });
            this.statuscode = this.response.statusCode;
            if (this.statuscode == 200) {
                this.body = this.response.body;
                if (this.body.includes("We're sorry, but this item is out of stock. It will be automatically removed from your shopping bag when you begin checkout.")) {
                    delete this.body;
                    delete this.statuscode;
                    delete this.response;
                    delete this.headers;
                    this.outputInfo("Info", `Waiting for restock (Cart) (${this.taskData.Analytics.startCheckoutAttempts})`)
                    await this.sleepTask(this.taskData.Delay);
                    return await this.startCheckout();
                } else if (this.body.includes('<li class="notavailable">This item is currently not available.</li>')) {
                    delete this.body;
                    delete this.statuscode;
                    delete this.response;
                    delete this.headers;
                    this.outputInfo("Info", `Waiting for restock (Cart) (${this.taskData.Analytics.startCheckoutAttempts})`)
                    await this.sleepTask(this.taskData.Delay);
                    return await this.startCheckout();
                } else if (this.body.includes('My Bag: 0 Items')) {
                    delete this.body;
                    delete this.statuscode;
                    delete this.response;
                    delete this.headers;
                    await this.cartProduct();
                    await this.sleepTask(this.taskData.Delay);
                    return await this.startCheckout();
                }
                if (this.body.split(`<div class="opc-summary-qty clearfix">\n<span class="label">Qty:</span>\n<span class="value">`)[0].split(`</span>`)[0] == 0) {
                    delete this.body;
                    delete this.response;
                    delete this.headers;
                    delete this.statusCode;
                    this.outputInfo("Info", `Waiting for restock (Checkout) (${this.taskData.Analytics.startCheckoutAttempts})`)
                    await this.sleepTask(this.taskData.Delay);
                    return await this.startCheckout();
                }
                this.csrfToken = this.body.split(`type="hidden" name="csrf_token" value=`)[1].split(`" />`)[0];
                this.profileSecureKey = this.body.split(`type="hidden" name="dwfrm_profile_securekey" value="`)[1].split(`" />`)[0];
                this.shippingSecureKey = this.body.split(`type="hidden" name="dwfrm_singleshipping_securekey" value="`)[1].split(`" />`)[0];
                this.billingSecureKey = this.body.split(`type="hidden" name="dwfrm_billing_securekey" value="`)[1].split(`" />`)[0];
                if (!this.csrfToken || !this.profileSecureKey || !this.shippingSecureKey || !this.billingSecureKey) {
                    delete this.csrfToken;
                    delete this.profileSecureKey;
                    delete this.shippingSecureKey;
                    delete this.billingSecureKey;
                    delete this.body;
                    delete this.statuscode;
                    delete this.response;
                    delete this.headers;
                    await this.sleepTask(this.taskData.Delay);
                    return await this.startCheckout();
                }
                this.taskData.csrfToken = this.csrfToken;
                this.taskData.profileSecureKey = this.profileSecureKey;
                this.taskData.shippingSecureKey = this.shippingSecureKey;
                this.taskData.billingSecureKey = this.billingSecureKey;
                delete this.csrfToken;
                delete this.profileSecureKey;
                delete this.shippingSecureKey;
                delete this.billingSecureKey;
                delete this.body;
                delete this.statuscode;
                delete this.response;
                delete this.headers;
                this.taskData.Analytics.startCheckoutTime = +new Date() - this.taskData.Analytics.startCheckoutTime;
            } else {
                delete this.statuscode;
                delete this.response;
                delete this.headers;
                await this.sleepTask(this.taskData.Delay);
                return await this.startCheckout();
            }
        } catch (exception) {
            delete this.headers;
            delete this.response;
            delete this.statuscode;
            if (exception.response) if (exception.response) delete exception.response.body;
            this.name = exception.name;
            if (this.name == 'RequestError') {
                this.code = exception.code;
                if (this.code == 'ECONNRESET' || this.code == 'ETIMEDOUT') {
                    delete this.name;
                    delete this.code;
                    this.outputInfo("Error", `Starting checkout (Connection error) (${this.taskData.Analytics.startCheckoutAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.startCheckout();
                }
                this.message = exception.message;
                if (this.message == 'tunneling socket could not be established, statusCode=407') {
                    delete this.name;
                    delete this.code;
                    delete this.message;
                    this.outputInfo("Error", `Starting checkout (Proxy authentication required) (${this.taskData.Analytics.startCheckoutAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.startCheckout();
                }
                delete this.message;
                delete this.name;
                delete this.code;
                this.outputInfo("Error", `Starting checkout (Request error) (${this.taskData.Analytics.startCheckoutAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.startCheckout();
            } else if (this.name == 'TimeoutError') {
                delete this.name;
                this.outputInfo("Error", `Starting checkout (Timed out) (${this.taskData.Analytics.startCheckoutAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.startCheckout();
            } else if (this.name == 'HTTPError') {
                delete this.name;
                this.statuscode = exception.response.statusCode;
                if (this.statuscode) {
                    this.responseheaders = exception.response.headers;
                    this.setcookieheader = this.responseheaders['set-cookie'];
                    if (!this.setcookieheader) {
                        delete exception.response.request;
                        delete exception.response.headers;
                        delete this.statuscode;
                        delete this.responseheaders;
                        delete this.setcookieheader;
                        this.outputInfo("Error", `Starting checkout (Akamai banned) (${this.taskData.Analytics.startCheckoutAttempts})`);
                        await this.sleepTask(this.taskData.Delay);
                        return await this.startCheckout();
                    }
                    for (this.cookie of this.setcookieheader) {
                        if (this.cookie.indexOf('_abck') > -1) {
                            delete exception.response.request;
                            delete exception.response.headers;
                            delete this.statuscode;
                            delete this.responseheaders;
                            delete this.setcookieheader;
                            delete this.cookie;
                            await this.fetchAkamaiCookie();
                            await this.sleepTask(this.taskData.Delay);
                            return await this.startCheckout();
                        }
                    }
                    this.statusmessage = exception.response.statusMessage;
                    this.outputInfo("Error", `Starting checkout (${this.statuscode} ${this.statusmessage}) (${this.taskData.Analytics.startCheckoutAttempts})`);
                    delete this.name;
                    delete this.statusmessage;
                    delete this.statuscode;
                    delete this.responseheaders;
                    delete this.setcookieheader;
                    await this.sleepTask(this.taskData.Delay);
                    return await this.startCheckout();
                } else {
                    delete this.name;
                    this.outputInfo("Error", `Starting checkout (Unforeseeable error) (${this.taskData.Analytics.startCheckoutAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.startCheckout();
                }
            } else {
                delete this.name;
                this.outputInfo("Error", `Starting checkout (Unforeseeable error) (${this.taskData.Analytics.startCheckoutAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.startCheckout();
            }
        }
    } async submitDetails() {
        try {
            this.taskData.Analytics.submitDetailsAttempts++;
            this.outputInfo("Info", `Submitting details (${this.taskData.Analytics.submitDetailsAttempts})`);
            this.form = new formdata();
            this.form.append('dwfrm_profile_securekey', this.taskData.profileSecureKey);
            this.form.append('dwfrm_billing_billingAddress_addressFields_email_emailAddress', this.taskData.Profile.Email);
            this.form.append('dwfrm_billing_billingAddress_addressFields_phone', this.taskData.Profile.Phone);
            this.form.append('dwfrm_singleshipping_shippingAddress_optInEmail', 'true');
            this.form.append('dwfrm_singleshipping_shippingAddress_alternateFirstName', '');
            this.form.append('dwfrm_singleshipping_shippingAddress_alternateLastName', '');
            this.form.append('dwfrm_singleshipping_securekey', this.taskData.shippingSecureKey);
            this.form.append('dwfrm_singleshipping_shippingAddress_addressFields_firstName', this.taskData.Profile.ShippingFirst);
            this.form.append('dwfrm_singleshipping_shippingAddress_addressFields_lastName', this.taskData.Profile.ShippingLast);
            this.form.append('dwfrm_singleshipping_shippingAddress_addressFields_address1', this.taskData.Profile.ShippingLine1);
            this.form.append('dwfrm_singleshipping_shippingAddress_addressFields_address2', this.taskData.Profile.ShippingLine2);
            this.form.append('dwfrm_singleshipping_shippingAddress_addressFields_city', this.taskData.Profile.ShippingCity);
            this.form.append('dwfrm_singleshipping_shippingAddress_addressFields_states_state', this.taskData.Profile.ShippingState);
            this.form.append('dwfrm_singleshipping_shippingAddress_addressFields_country', this.taskData.Profile.ShippingCountry);
            this.form.append('dwfrm_singleshipping_shippingAddress_addressFields_postal', this.taskData.Profile.ShippingPostal);
            this.form.append('dwfrm_singleshipping_originID', 'DSK');
            this.form.append('dwfrm_billing_paymentMethods_selectedPaymentMethodID', 'CREDIT_CARD');
            this.form.append('dwfrm_billing_paymentMethods_creditCard_number', this.taskData.Profile.CardNumber.replace(/\s/g, ''));
            this.form.append('dwfrm_billing_paymentMethods_creditCard_owner', this.taskData.Profile.CardHolder);
            this.form.append('dwfrm_billing_paymentMethods_creditCard_type', this.taskData.Profile.CardType);
            this.form.append('expDate', this.taskData.Profile.CardExpirationMonth + '/' + this.taskData.Profile.CardExpirationYear);
            this.form.append('dwfrm_billing_paymentMethods_creditCard_expiration_month', this.taskData.Profile.CardExpirationMonth.replace('0', ''));
            this.form.append('dwfrm_billing_paymentMethods_creditCard_expiration_year', this.taskData.Profile.CardExpirationYear);
            this.form.append('dwfrm_billing_paymentMethods_creditCard_cvn', this.taskData.Profile.CardCVN);
            this.form.append('dwfrm_billing_save', 'true');
            this.form.append('dwfrm_billing_securekey', this.taskData.billingSecureKey);
            this.form.append('ltkSubscriptionCode', 'checkoutbilling');
            this.form.append('dwfrm_billing_billingAddress_addressFields_firstName', this.taskData.Profile.BillingFirst);
            this.form.append('dwfrm_billing_billingAddress_addressFields_lastName', this.taskData.Profile.BillingLast);
            this.form.append('dwfrm_billing_billingAddress_addressFields_address1', this.taskData.Profile.BillingLine1);
            this.form.append('dwfrm_billing_billingAddress_addressFields_address2', this.taskData.Profile.BillingLine2);
            this.form.append('dwfrm_billing_billingAddress_addressFields_city', this.taskData.Profile.BillingCity);
            this.form.append('dwfrm_billing_billingAddress_addressFields_states_state', this.taskData.Profile.BillingState);
            this.form.append('dwfrm_billing_billingAddress_addressFields_postal', this.taskData.Profile.BillingPostal);
            this.form.append('dwfrm_billing_billingAddress_addressFields_country', this.taskData.Profile.BillingCountry);
            this.form.append('csrf_token', this.taskData.csrfToken);
            this.form.append('shippingID', 'SP');
            this.headers = {
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'en-US,en;q=0.9',
                'origin': 'https://www.pacsun.com',
                'referer': 'https://www.pacsun.com/on/demandware.store/Sites-pacsun-Site/default/COSummary-Submit',
				'sec-ch-ua-mobile': '?0',
				'sec-fetch-dest': 'empty',
				'sec-fetch-mode': 'cors',
				'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36',
                'x-requested-with': 'XMLHttpRequest',
            }
            /*
            The URL "on/demandware.store/Sites-pacsun-Site/default/COCheckout-OrderSubmit" is protected by Akamai Bot Manager. 
            However, for some reason, any HTTP method other than POST is allowed to pass through.

            */
            this.response = await got.put('on/demandware.store/Sites-pacsun-Site/default/COCheckout-OrderSubmit', {
                headers: this.headers,
                cookieJar: this.cookieJar,
                agent: this.taskData.Agent,
                prefixUrl: 'https://www.pacsun.com',
                body: this.form,
                responseType: 'json',
                timeout: 15000,
            });
            this.statuscode = this.response.statusCode;
            if (this.statuscode == 200) {
                this.body = this.response.body;
                this.success = this.body.success;
                this.optInOrigin = this.body.optInOrigin;
                if (!this.success || !this.optInOrigin == 'null') {
                    delete this.success;
                    delete this.optInOrigin;
                    delete this.statuscode;
                    delete this.body;
                    delete this.response;
                    delete this.headers;
                    delete this.form;
                    await this.sleepTask(this.taskData.Delay);
                    return await this.submitDetails();
                }
            } else {
                delete this.statuscode;
                delete this.response;
                delete this.headers;
                delete this.form;
                await this.sleepTask(this.taskData.Delay);
                return await this.submitDetails();
            }
        } catch (exception) {
            delete this.form;
            delete this.headers;
            delete this.response;
            delete this.statuscode;
            if (exception.response) if (exception.response) delete exception.response.body;
            this.name = exception.name;
            if (this.name == 'RequestError') {
                this.code = exception.code;
                if (this.code == 'ECONNRESET' || this.code == 'ETIMEDOUT') {
                    delete this.name;
                    delete this.code;
                    this.outputInfo("Error", `Submitting details (Connection error) (${this.taskData.Analytics.submitDetailsAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.submitDetails();
                }
                this.message = exception.message;
                if (this.message == 'tunneling socket could not be established, statusCode=407') {
                    delete this.name;
                    delete this.code;
                    delete this.message;
                    this.outputInfo("Error", `Submitting details (Proxy authentication required) (${this.taskData.Analytics.submitDetailsAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.submitDetails();
                }
                delete this.message;
                delete this.name;
                delete this.code;
                this.outputInfo("Error", `Submitting details (Request error) (${this.taskData.Analytics.submitDetailsAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.submitDetails();
            } else if (this.name == 'TimeoutError') {
                delete this.name;
                this.outputInfo("Error", `Submitting details (Timed out) (${this.taskData.Analytics.submitDetailsAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.submitDetails();
            } else if (this.name == 'HTTPError') {
                this.statuscode = exception.response.statusCode;
                if (this.statuscode) {
                    this.responseheaders = exception.response.headers;
                    this.setcookieheader = this.responseheaders['set-cookie'];
                    if (!this.setcookieheader) {
                        delete this.name;
                        delete this.statuscode;
                        delete this.responseheaders;
                        delete this.setcookieheader;
                        this.outputInfo("Error", `Submitting details (Akamai banned) (${this.taskData.Analytics.submitDetailsAttempts})`);
                        await this.sleepTask(this.taskData.Delay);
                        return await this.submitDetails();
                    }
                    for (this.cookie of this.setcookieheader) {
                        if (this.cookie.indexOf('_abck') > -1) {
                            await this.fetchAkamaiCookie();
                            delete this.name;
                            delete this.statuscode;
                            delete this.responseheaders;
                            delete this.setcookieheader;
                            delete this.cookie;
                            await this.sleepTask(this.taskData.Delay);
                            return await this.submitDetails();
                        }
                    }
                    this.statusmessage = exception.response.statusMessage;
                    this.outputInfo("Error", `submitting details (${this.statuscode} ${this.statusmessage}) (${this.taskData.Analytics.submitDetailsAttempts})`);
                    delete this.name;
                    delete this.statusmessage;
                    delete this.statuscode;
                    delete this.responseheaders;
                    delete this.setcookieheader;
                    await this.sleepTask(this.taskData.Delay);
                    return await this.submitDetails();
                } else {
                    delete this.name;
                    this.outputInfo("Error", `Submitting details (Unforeseeable error) (${this.taskData.Analytics.submitDetailsAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.submitDetails();
                }
            } else {
                delete this.name;
                this.outputInfo("Error", `Submitting details (Unforeseeable error) (${this.taskData.Analytics.submitDetailsAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.submitDetails();
            }
        }
    } async submitCheckout() {
        try {
            this.taskData.Analytics.checkoutSpeedTime = +new Date();
            this.taskData.Analytics.submitCheckoutAttempts++;
            this.outputInfo("Info", `Submitting checkout (${this.taskData.Analytics.submitCheckoutAttempts})`);
            this.headers = {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'accept-language': 'en-US,en;q=0.9',
                'referer': 'https://www.pacsun.com/on/demandware.store/Sites-pacsun-Site/default/COSummary-Submit',
				'sec-ch-ua-mobile': '?0',
				'sec-fetch-dest': 'document',
				'sec-fetch-site': 'same-origin',
				'sec-fetch-user': '?1',
				'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36'
            }
            this.response = await got.get('on/demandware.store/Sites-pacsun-Site/default/COSummary-Submit', {
                headers: this.headers,
                cookieJar: this.cookieJar,
                agent: this.taskData.Agent,
                prefixUrl: 'https://www.pacsun.com',
                timeout: 15000,
            });
            this.statuscode = this.response.statusCode;
            if (this.statuscode == 200) {
                this.body = this.response.body;
                if (this.body.includes('Payment method declined by issuing bank. Please contact issuing bank for further information or use another method of payment.')) {
                    delete this.body;
                    delete this.statuscode;
                    delete this.response;
                    delete this.headers;
                    this.taskData.Analytics.taskTotalTime = +new Date() - this.taskData.Analytics.taskTotalTime;
                    this.taskData.Analytics.checkoutSpeedTime = +new Date() - this.taskData.Analytics.checkoutSpeedTime;
                    this.outputInfo("Error", "Payment declined");
                    return await this.postFailure();
                }
                this.$ = cheerio.load(this.body);
                if (this.$('div.order-confirmation div.order-data div.order-number span.value').text()) {
                    this.taskData.orderNumber = this.$('div.order-confirmation div.order-data div.order-number span.value').text();
                    delete this.$;
                    delete this.body;
                    delete this.statuscode;
                    delete this.response;
                    delete this.headers;
                    this.taskData.Analytics.taskTotalTime = +new Date() - this.taskData.Analytics.taskTotalTime;
                    this.taskData.Analytics.checkoutSpeedTime = +new Date() - this.taskData.Analytics.checkoutSpeedTime;
                    this.outputInfo("Info", "Checked out");
                    return await this.postCheckout();
                } else {
                    delete this.$;
                    delete this.body;
                    delete this.statuscode;
                    delete this.response;
                    delete this.headers;
                    this.taskData.Analytics.taskTotalTime = +new Date() - this.taskData.Analytics.taskTotalTime;
                    this.taskData.Analytics.checkoutSpeedTime = +new Date() - this.taskData.Analytics.checkoutSpeedTime;
                    this.outputInfo("Error", "Payment error");
                }
            } else {
                delete this.statuscode;
                delete this.response;
                delete this.headers;
                await this.sleepTask(this.taskData.Delay);
                return await this.submitCheckout();
            }
        } catch (exception) {
            delete this.headers;
            delete this.response;
            delete this.statuscode;
            if (exception.response) if (exception.response) delete exception.response.body;
            this.name = exception.name;
            if (this.name == 'RequestError') {
                this.code = exception.code;
                if (this.code == 'ECONNRESET' || this.code == 'ETIMEDOUT') {
                    delete this.name;
                    delete this.code;
                    this.outputInfo("Error", `Submitting checkout (Connection error) (${this.taskData.Analytics.submitCheckoutAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.submitCheckout();
                }
                this.message = exception.message;
                if (this.message == 'tunneling socket could not be established, statusCode=407') {
                    delete this.name;
                    delete this.code;
                    delete this.message;
                    this.outputInfo("Error", `Submitting checkout (Proxy authentication required) (${this.taskData.Analytics.submitCheckoutAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.submitCheckout();
                }
                delete this.message;
                delete this.name;
                delete this.code;
                this.outputInfo("Error", `Submitting checkout (Request error) (${this.taskData.Analytics.submitCheckoutAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.submitCheckout();
            } else if (this.name == 'TimeoutError') {
                delete this.name;
                this.outputInfo("Error", `Submitting checkout (Timed out) (${this.taskData.Analytics.submitCheckoutAttempts})`)
                await this.sleepTask(this.taskData.Delay);
                return await this.submitDetails();
            } else if (this.name == 'HTTPError') {
                this.statuscode = exception.response.statusCode;
                if (this.statuscode) {
                    this.responseheaders = exception.response.headers;
                    this.setcookieheader = this.responseheaders['set-cookie'];
                    if (!this.setcookieheader) {
                        delete this.name;
                        delete this.statuscode;
                        delete this.responseheaders;
                        delete this.setcookieheader;
                        this.outputInfo("Error", `Submitting checkout (Akamai banned) (${this.taskData.Analytics.submitCheckoutAttempts})`);
                        await this.sleepTask(this.taskData.Delay);
                        return await this.submitCheckout();
                    }
                    for (this.cookie of this.setcookieheader) {
                        if (this.cookie.indexOf('_abck') > -1) {
                            await this.fetchAkamaiCookie();
                            delete this.name;
                            delete this.statuscode;
                            delete this.responseheaders;
                            delete this.setcookieheader;
                            delete this.cookie;
                            await this.sleepTask(this.taskData.Delay);
                            return await this.submitCheckout();
                        }
                    }
                    this.statusmessage = exception.response.statusMessage;
                    this.outputInfo("Error", `Submitting checkout (${this.statuscode} ${this.statusmessage}) (${this.taskData.Analytics.submitCheckoutAttempts})`);
                    delete this.name;
                    delete this.statusmessage;
                    delete this.statuscode;
                    delete this.responseheaders;
                    delete this.setcookieheader;
                    await this.sleepTask(this.taskData.Delay);
                    return await this.submitCheckout();
                } else {
                    delete this.name;
                    this.outputInfo("Error", `Submitting checkout (Unforeseeable error) (${this.taskData.Analytics.submitCheckoutAttempts})`);
                    await this.sleepTask(this.taskData.Delay);
                    return await this.submitCheckout();
                }
            } else {
                delete this.name;
                this.outputInfo("Error", `Submitting checkout (Unforeseeable error) (${this.taskData.Analytics.submitCheckoutAttempts})`);
                await this.sleepTask(this.taskData.Delay);
                return await this.submitCheckout();
            }
        }
    } async postCheckout() {
        try {
            this.headers = {
                'accept': 'application/json',
                'content-type': 'application/json',
                'user-agent': '',
            }
            this.response = await got.post(this.taskData.Webhook, {
                headers: this.headers,
                json: {
                    embeds: [{
                        title: 'Successful Checkout (Pacsun Desktop)',
                        color: 65280,
                        timestamp: new Date(),
                        thumbnail: { url: this.taskData.productDetails.productImage },
                        fields: [
                            { name: 'Product', value: this.taskData.productDetails.productName, inline: true },
                            { name: 'Size', value: `${this.taskData.productDetails.productSize} / ${this.taskData.productDetails.productColor}`, inline: true },
                            { name: 'Quantity', value: this.taskData.Quantity, inline: true },
                            { name: 'Price', value: this.taskData.productDetails.productPrice, inline: true },
                            { name: 'Proxy', value: `||${this.taskData.Proxy ? this.taskData.Proxy.split(':')[0] : 'None'}||`, inline: true },
                            { name: 'Profile', value: `||${this.taskData.Profile.ProfileName}||`, inline: true },
                            { name: 'Order Number', value: `||${this.taskData.orderNumber ? this.taskData.orderNumber : 'None'}||`, inline: true },
                            { name: 'Email', value: `||${this.taskData.Profile.Email}||`, inline: true },
                        ]
                    }]
                }
            });
            delete this.headers;
            delete this.response;
            return await this.submitTaskAnalytics();
        } catch (exception) {
            delete this.headers;
            delete this.response;
            await this.sleepTask(this.taskData.Delay);
            return await this.postFailure();
        }
    } async postFailure() {
        try {
            this.headers = {
                'accept': 'application/json',
                'content-type': 'application/json',
                'user-agent': '',
            }
            this.response = await got.post(this.taskData.Webhook, {
                headers: this.headers,
                json: {
                    embeds: [{
                        title: 'Checkout Failed (Pacsun Desktop)',
                        color: 16711680,
                        timestamp: new Date(),
                        thumbnail: { url: this.taskData.productDetails.productImage },
                        fields: [
                            { name: 'Product', value: this.taskData.productDetails.productName, inline: true },
                            { name: 'Size', value: `${this.taskData.productDetails.productSize} / ${this.taskData.productDetails.productColor}`, inline: true },
                            { name: 'Quantity', value: this.taskData.Quantity, inline: true },
                            { name: 'Price', value: this.taskData.productDetails.productPrice, inline: true },
                            { name: 'Proxy', value: `||${this.taskData.Proxy ? this.taskData.Proxy.split(':')[0] : 'None'}||`, inline: true },
                            { name: 'Profile', value: `||${this.taskData.Profile.ProfileName}||`, inline: true },
                        ]
                    }]
                }
            });
            delete this.headers;
            delete this.response;
            return await this.submitTaskAnalytics();
        } catch (exception) {
            delete this.headers;
            delete this.response;
            await this.sleepTask(this.taskData.Delay);
            return await this.postFailure();
        }
    } async initializeTask() {
        try {
            this.outputInfo("Info", "Initializing task");
            if (this.taskData.InputType != 'Variant') {
                await this.searchForProduct();
            }
            if (this.taskData.Stopped) return;
            await this.cartProduct();
            if (this.taskData.Stopped) return;
            await this.startCheckout();
            if (this.taskData.Stopped) return;
            await this.submitDetails();
            if (this.taskData.Stopped) return;
            await this.submitCheckout();
        } catch (exception) {
            this.outputInfo("Info", "Task stopped")
            return;
        }
    }
}

module.exports.desktop = pacsunDesktop;