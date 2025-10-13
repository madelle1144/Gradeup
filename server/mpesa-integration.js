const axios = require('axios');

class MpesaIntegration {
    constructor() {
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        this.shortcode = process.env.MPESA_SHORTCODE;
        this.passkey = process.env.MPESA_PASSKEY;
        this.callbackURL = process.env.MPESA_CALLBACK_URL;
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        // Check if we have a valid token
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
            
            const response = await axios.get(
                'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
                {
                    headers: {
                        Authorization: `Basic ${auth}`
                    }
                }
            );

            this.accessToken = response.data.access_token;
            // Token expires in 1 hour, set expiry to 55 minutes for safety
            this.tokenExpiry = Date.now() + (55 * 60 * 1000);
            
            return this.accessToken;
        } catch (error) {
            console.error('Error getting M-Pesa access token:', error);
            throw new Error('Failed to get M-Pesa access token');
        }
    }

    async initiateSTKPush(phone, amount, accountReference, transactionDesc) {
        try {
            const accessToken = await this.getAccessToken();
            const timestamp = this.generateTimestamp();
            const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

            const requestData = {
                BusinessShortCode: this.shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: amount,
                PartyA: phone,
                PartyB: this.shortcode,
                PhoneNumber: phone,
                CallBackURL: this.callbackURL,
                AccountReference: accountReference,
                TransactionDesc: transactionDesc
            };

            const response = await axios.post(
                'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
                requestData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                checkoutRequestID: response.data.CheckoutRequestID,
                responseDescription: response.data.ResponseDescription,
                customerMessage: response.data.CustomerMessage
            };

        } catch (error) {
            console.error('M-Pesa STK Push error:', error);
            
            let errorMessage = 'Payment processing failed';
            if (error.response && error.response.data) {
                errorMessage = error.response.data.errorMessage || errorMessage;
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    async checkPaymentStatus(checkoutRequestID) {
        try {
            const accessToken = await this.getAccessToken();
            const timestamp = this.generateTimestamp();
            const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

            const requestData = {
                BusinessShortCode: this.shortcode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestID
            };

            const response = await axios.post(
                'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
                requestData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const resultCode = response.data.ResultCode;
            const resultDesc = response.data.ResultDesc;

            if (resultCode === '0') {
                return {
                    success: true,
                    confirmed: true,
                    transactionID: response.data.MpesaReceiptNumber,
                    phone: response.data.PhoneNumber,
                    amount: response.data.Amount
                };
            } else {
                return {
                    success: false,
                    confirmed: false,
                    error: resultDesc
                };
            }

        } catch (error) {
            console.error('M-Pesa status check error:', error);
            return {
                success: false,
                confirmed: false,
                error: 'Failed to check payment status'
            };
        }
    }

    generateTimestamp() {
        return new Date().toISOString().replace(/[-:.]/g, '').slice(0, -3);
    }

    formatPhoneNumber(phone) {
        // Convert 07... to 2547...
        if (phone.startsWith('07')) {
            return '254' + phone.substring(1);
        }
        if (phone.startsWith('7')) {
            return '254' + phone;
        }
        if (phone.startsWith('+254')) {
            return phone.substring(1);
        }
        return phone;
    }
}

module.exports = MpesaIntegration;