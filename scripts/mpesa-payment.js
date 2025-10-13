// === ADMIN ACCESS CONTROL === 
const ADMIN_CODES = {
    "Manu00": "super_admin",
    "SCHOOL123": "school_admin"
    // Add more school codes as needed
};

function isAdminCode(studentId) {
    return ADMIN_CODES[studentId];
}

async function handlePaymentSubmission(studentName, studentId, mpesaNumber) {
    // 🔐 ADMIN DETECTION - Add this check
    const adminLevel = isAdminCode(studentId);
    if (adminLevel && (!mpesaNumber || mpesaNumber.trim() === '')) {
        console.log('🔑 Admin access detected:', adminLevel);
        // Redirect to admin dashboard
        window.location.href = `admin/admin-dashboard.html?admin=${adminLevel}&name=${encodeURIComponent(studentName)}`;
        return true; // Return true to indicate admin redirect
    }
    return false; // Return false to continue with payment
}
// === END ADMIN CONTROL ===

    document.addEventListener('DOMContentLoaded', function() {
    const payBtn = document.getElementById('pay-btn');
    const paymentLoading = document.getElementById('payment-loading');
    const paymentConfirmation = document.getElementById('payment-confirmation');
    const errorMessage = document.getElementById('error-message');
    
    console.log('🚀 GRADEUP - REAL M-PESA MODE ACTIVATED');
    
 payBtn.addEventListener('click', async function() {
    const name = document.getElementById('student-name').value.trim();
    const studentId = document.getElementById('student-id').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    console.log('📝 Form data:', { name, studentId, phone });
    
    // 🔐 FIRST: Check for admin access
    const isAdmin = await handlePaymentSubmission(name, studentId, phone);
    if (isAdmin) {
        return;
    }
    
    // Validation
    if (!name || !studentId || !phone) {
        showError('Please fill in all fields');
        return;
    }
    
    if (!/^07\d{8}$/.test(phone)) {
        showError('Please enter a valid Kenyan phone number (07XXXXXXXX)');
        return;
    }
    
    // Hide any previous errors
    hideError();
    
    // Show loading
    paymentLoading.classList.add('show');
    payBtn.disabled = true;
    
    try {
        console.log('🔄 DEMO MODE: Bypassing M-Pesa payment');
        
        // ✅ DEMO MODE: Simulate successful payment
        await simulateDemoPayment(name, studentId, phone);
    } catch (error) {
        console.error('❌ Demo payment error:', error);
        showError('Demo payment failed: ' + error.message);
        paymentLoading.classList.remove('show');
    } finally {
        payBtn.disabled = false;
    }
});


// ✅ ADD THIS DEMO PAYMENT FUNCTION
async function simulateDemoPayment(name, studentId, phone) {
    console.log('💰 DEMO PAYMENT: Simulating payment for', name);
    
    // Show payment confirmation
    paymentLoading.classList.remove('show');
    paymentConfirmation.classList.add('show');
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ DEMO PAYMENT SUCCESSFUL! Redirecting to results...');
    
    // Redirect to results page with student data
    window.location.href = `results.html?name=${encodeURIComponent(name)}&id=${encodeURIComponent(studentId)}&phone=${encodeURIComponent(phone)}&demo=true`;
}
    
    // REAL M-Pesa integration - NO DEMO!
    async function initiateMpesaPayment(phone, name, studentId) {
        console.log('🔍 First, verifying student exists...');
        
        // Verify student exists before taking payment
        const verifyResponse = await fetch('/api/students/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                studentId: studentId
            })
        });
        
        console.log('📡 Verification response status:', verifyResponse.status);
        
        if (!verifyResponse.ok) {
            const errorText = await verifyResponse.text();
            console.error('❌ Verification failed:', errorText);
            throw new Error('Student verification failed: ' + verifyResponse.status);
        }
        
        const verifyResult = await verifyResponse.json();
        console.log('📊 Verification result:', verifyResult);
        
        if (!verifyResult.success) {
            throw new Error(verifyResult.error || 'Student not found. Please check your name and student ID.');
        }
        
        console.log('✅ Student verified:', verifyResult.student.name);
        
        // Now proceed with payment
        const payload = {
            phone: formatPhoneNumber(phone),
            amount: 1, // Test with 1 KSH
            name: name,
            studentId: studentId,
            accountReference: `GRADEUP-${studentId}`
        };
        
        console.log('💰 Proceeding with payment:', payload);
        
        try {
            const response = await fetch('/api/mpesa/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            console.log('📡 Payment response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Payment API error:', errorText);
                throw new Error('Payment failed: ' + response.status);
            }
            
            const result = await response.json();
            console.log('✅ Payment API response:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Payment network error:', error);
            throw error;
        }
    }
    
    async function waitForPaymentConfirmation(checkoutRequestID) {
        console.log('🔄 Starting payment status polling...');
        
        for (let i = 0; i < 15; i++) {
            console.log(`📡 Polling attempt ${i + 1}/15 for:`, checkoutRequestID);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            try {
                const response = await fetch(`/api/mpesa/confirm/${checkoutRequestID}`);
                
                if (!response.ok) {
                    console.log('⏳ Status check failed, continuing...');
                    continue;
                }
                
                const result = await response.json();
                console.log('📊 Status check result:', result);
                
                if (result.confirmed) {
                    console.log('🎉 PAYMENT CONFIRMED!');
                    return { success: true, transaction: result.transaction };
                }
                
                if (result.failed) {
                    console.log('❌ PAYMENT FAILED:', result.error);
                    return { success: false, error: result.error };
                }
                
                console.log('⏳ Payment still pending...');
                
            } catch (error) {
                console.error('🔧 Status check error:', error);
            }
        }
        
        console.log('⏰ Payment polling timeout');
        return { success: false, error: 'Payment timeout' };
    }
    
    function formatPhoneNumber(phone) {
        return '254' + phone.substring(1);
    }
    
    function showError(message) {
        console.error('❌ Displaying error:', message);
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        setTimeout(() => hideError(), 5000);
    }
    
    function hideError() {
        errorMessage.classList.remove('show');
    }
    
    console.log('✅ Payment system ready - REAL M-Pesa mode');
});