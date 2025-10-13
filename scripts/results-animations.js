document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 Celebration animations loaded');
    
    // Get student data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const studentName = urlParams.get('name');
    const studentId = urlParams.get('id');
    
    console.log('📝 Student details:', { studentName, studentId });
    
    if (studentName && studentId) {
        startCelebration(studentName, studentId);
    } else {
        console.error('❌ Missing student name or ID');
    }
});

async function fetchStudentData(studentName, studentId) {
    try {
        console.log('📡 Fetching student data for ID:', studentId);
        
        const apiUrl = `/api/students/${studentId}`;
        console.log('🔗 API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('📊 Raw API Response:', result);
        
        if (!result.success || !result.student) {
            throw new Error('Invalid API response structure');
        }
        
        const studentData = result.student;
        console.log('🎓 Student data from API:', studentData);
        
        const mappedData = {
            id: studentData.id || studentId,
            name: studentData.name || studentName,
            class: studentData.class || '',
            promoted: studentData.promoted === 'YES' || 
                     studentData.promoted === true || 
                     studentData.promoted === 'True' ||
                     studentData.promoted === '1',
            term1: parseFloat(studentData.term1) || 0,
            term2: parseFloat(studentData.term2) || 0,
            term3: parseFloat(studentData.term3) || 0
        };
        
        console.log('✅ Mapped student data:', mappedData);
        
        if (mappedData.term1 === 0 && mappedData.term2 === 0 && mappedData.term3 === 0) {
            console.warn('⚠️ All term scores are zero - might be missing data');
        }
        
        return mappedData;
        
    } catch (error) {
        console.error('❌ Error fetching student data:', error);
        throw error;
    }
}

function updatePerformanceGraph(studentData) {
    const graph = document.querySelector('.performance-graph');
    if (!graph) {
        console.error('❌ Performance graph element not found');
        return;
    }
    
    graph.innerHTML = '<h3>Your Performance Progress</h3>';
    
    const terms = [
        { name: 'Term 1', score: studentData.term1 },
        { name: 'Term 2', score: studentData.term2 },
        { name: 'Term 3', score: studentData.term3 }
    ];
    
    console.log('📊 Creating graph with term data:', terms);
    
    terms.forEach(term => {
        const barContainer = document.createElement('div');
        barContainer.style.cssText = 'margin: 15px 0; position: relative;';
        
        const label = document.createElement('div');
        label.textContent = term.name;
        label.style.cssText = 'font-weight: bold; margin-bottom: 5px;';
        
        const barBackground = document.createElement('div');
        barBackground.style.cssText = `
            width: 100%;
            height: 30px;
            background: #f0f0f0;
            border-radius: 5px;
            position: relative;
            overflow: hidden;
        `;
        
        const bar = document.createElement('div');
        bar.className = 'graph-bar';
        bar.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #4ECDC4, #45B7D1);
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            transition: width 1s ease-out;
        `;
        bar.textContent = `${typeof term.score === 'number' && !isNaN(term.score) ? term.score : 0}%`;
        
        barBackground.appendChild(bar);
        barContainer.appendChild(label);
        barContainer.appendChild(barBackground);
        graph.appendChild(barContainer);
        
        setTimeout(() => {
            bar.style.width = `${typeof term.score === 'number' && !isNaN(term.score) ? term.score : 0}%`;
        }, 100);
    });
}

function updatePersonalMessage(studentData) {
    const messageElement = document.querySelector('.personal-message');
    if (!messageElement) {
        console.error('❌ Personal message element not found');
        return;
    }
    
    let message = '';
    const improvement = studentData.term3 - studentData.term1;
    const avgScore = (studentData.term1 + studentData.term2 + studentData.term3) / 3;
    
    console.log('📈 Performance metrics:', { improvement, avgScore, promoted: studentData.promoted });
    
    if (studentData.promoted) {
        if (improvement > 20) {
            message = `🌟 Outstanding progress! You've improved by ${improvement} points throughout the year, showing incredible dedication and growth. Your consistent effort has paid off, and we're thrilled to promote you to the next class!`;
        } else if (improvement > 10) {
            message = `🎯 Excellent work! You've shown steady improvement with a ${improvement}-point increase in performance. Your commitment to learning is commendable, and we're proud to promote you to the next class!`;
        } else if (avgScore >= 80) {
            message = `🏆 Congratulations on maintaining excellent academic performance! Your consistent high scores (average: ${avgScore.toFixed(1)}%) demonstrate strong understanding. We're pleased to promote you to the next class!`;
        } else {
            message = `✅ Well done! You've maintained solid academic performance throughout the year. Your dedication to learning is evident, and we're happy to promote you to the next class!`;
        }
    } else {
        message = `📚 While you've shown effort this year, we believe you would benefit from additional time to strengthen your foundation. Your current performance shows room for growth, and our teachers will work closely with you to ensure you're fully prepared for future success.`;
        
        const congratsElement = document.querySelector('.congrats');
        const downloadBtn = document.getElementById('download-btn');
        const certTitle = document.querySelector('.certificate h2');
        const certText = document.querySelector('.certificate p');
        
        if (congratsElement) {
            congratsElement.textContent = 'ACADEMIC REVIEW';
            congratsElement.style.color = '#ff6b4a';
        }
        if (downloadBtn) downloadBtn.style.display = 'none';
        if (certTitle) certTitle.textContent = 'ACADEMIC PROGRESS REPORT';
        if (certText) certText.textContent = `This report summarizes the academic progress of ${studentData.name}`;
    }
    
    messageElement.textContent = message;
}

// 🔧 FIXED: Certificate download function with proper name handling
function setupCertificateDownload(studentData) {
    const downloadBtn = document.getElementById('download-btn');
    if (!downloadBtn) {
        console.error('❌ Download button not found');
        return;
    }

    downloadBtn.addEventListener('click', function() {
        console.log('📄 Generating certificate for:', studentData.name);
        
        // Get the certificate element
        const certificate = document.querySelector('.certificate');
        if (!certificate) {
            console.error('❌ Certificate element not found');
            alert('Certificate not found on page');
            return;
        }

        // Create a clone of the certificate for HTML2Canvas
        const certificateClone = certificate.cloneNode(true);
        
        // 🔧 CRITICAL FIX: Ensure the student name is properly set in the certificate clone
        const nameElements = certificateClone.querySelectorAll('.student-name, .certificate-name, [data-student-name]');
        console.log('🔍 Found name elements in certificate:', nameElements.length);
        
        if (nameElements.length > 0) {
            nameElements.forEach(element => {
                console.log('📝 Updating name element from:', element.textContent, 'to:', studentData.name);
                element.textContent = studentData.name;
                element.style.display = 'block';
                element.style.visibility = 'visible';
                element.style.opacity = '1';
            });
        } else {
            // If no specific name element found, look for any element that might contain the name
            const allElements = certificateClone.querySelectorAll('*');
            allElements.forEach(element => {
                if (element.textContent && element.textContent.includes('Student Name') || 
                    element.textContent && element.textContent.includes('Name:')) {
                    console.log('📝 Found potential name container:', element.textContent);
                    element.textContent = element.textContent.replace(/Student Name|Name:.*/, `Name: ${studentData.name}`);
                }
            });
        }

        // Add styles for better PDF rendering
        certificateClone.style.cssText = `
            width: 800px !important;
            height: 600px !important;
            padding: 40px !important;
            background: white !important;
            border: 3px solid gold !important;
            box-shadow: 0 0 20px rgba(0,0,0,0.3) !important;
            margin: 0 auto !important;
        `;

        // Use html2canvas to capture the certificate
        html2canvas(certificateClone, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            // Convert canvas to image and trigger download
            const link = document.createElement('a');
            link.download = `Certificate_${studentData.name.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            console.log('✅ Certificate downloaded for:', studentData.name);
        }).catch(error => {
            console.error('❌ Error generating certificate:', error);
            alert('Error generating certificate. Please try again.');
        });
    });
}

async function startCelebration(studentName, studentId) {
    console.log('🎉 Starting celebration for:', studentName, 'ID:', studentId);
    
    try {
        const studentData = await fetchStudentData(studentName, studentId);
        console.log('🎓 Using student data:', studentData);
        
        // 🔧 FIXED: Comprehensive name update with certificate setup
        {
            console.log('🔍 === COMPREHENSIVE NAME DEBUGGING START ===');
            
            // Update all name elements on the page
            const nameSelectors = [
                '.student-name', '.studentName', '.student_name',
                '.certificate-name', '.certificateName', '.certificate_name', 
                '.name', '#name', '[data-name]', '[data-student]'
            ];

            let nameUpdated = false;
            nameSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    console.log(`📝 Updating ${selector}: "${element.textContent}" → "${studentData.name}"`);
                    element.textContent = studentData.name;
                    nameUpdated = true;
                });
            });

            if (!nameUpdated) {
                console.log('⚠️ No standard name elements found, searching for alternatives...');
                
                // Search for any element that might contain the student name
                const allElements = document.querySelectorAll('*');
                allElements.forEach(element => {
                    if (element.textContent && element.textContent.trim() === studentName) {
                        console.log(`📝 Found and updating dynamic name: "${element.textContent}" → "${studentData.name}"`);
                        element.textContent = studentData.name;
                        nameUpdated = true;
                    }
                });
            }

            if (nameUpdated) {
                console.log('✅ Student name updated successfully throughout the page');
            } else {
                console.warn('⚠️ Could not find name elements to update');
            }
        }

        // Update performance graph and personal message
        updatePerformanceGraph(studentData);
        updatePersonalMessage(studentData);
        
        // 🔧 FIXED: Setup certificate download with proper name
        setupCertificateDownload(studentData);

        // Start celebration animations if promoted
        if (studentData.promoted) {
            console.log('🎊 Student is promoted - starting celebrations!');
            startChampionCelebration();
        } else {
            console.log('📚 Student is not promoted - showing academic review');
        }

    } catch (error) {
        console.error('❌ Error in celebration process:', error);
        // Show error message to user
        const errorElement = document.querySelector('.error-message') || document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.cssText = `
            color: #e74c3c;
            background: #fdf2f2;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
            border: 1px solid #e74c3c;
        `;
        errorElement.textContent = 'Unable to load student data. Please check your connection and try again.';
        
        const container = document.querySelector('.results-container') || document.querySelector('main');
        if (container) {
            container.prepend(errorElement);
        }
    }
}

// All champion celebration functions remain the same
function startChampionCelebration() {
    console.log('🏆 Starting CHAMPION celebration - Trophy style!');
    
    const existingConfetti = document.querySelector('.confetti-container');
    if (existingConfetti) {
        existingConfetti.remove();
    }
    
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    confettiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
        overflow: hidden;
    `;
    document.body.appendChild(confettiContainer);
    
    if (!document.querySelector('#champion-confetti-styles')) {
        const style = document.createElement('style');
        style.id = 'champion-confetti-styles';
        style.textContent = `
            @keyframes champion-fall {
                0% {
                    transform: translateY(-20px) translateX(0) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(110vh) translateX(${Math.random() * 100 - 50}px) rotate(${Math.random() * 1080}deg);
                    opacity: 0.8;
                }
            }
            
            @keyframes trophy-spin {
                0% {
                    transform: scale(0) rotate(0deg);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.5) rotate(180deg);
                    opacity: 1;
                }
                100% {
                    transform: scale(1) rotate(360deg);
                    opacity: 1;
                }
            }
            
            @keyframes champion-float {
                0%, 100% {
                    transform: translateY(0px) scale(1);
                }
                50% {
                    transform: translateY(-30px) scale(1.1);
                }
            }
            
            @keyframes sparkle {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.5;
                    transform: scale(1.3);
                }
            }
            
            .champion-text {
                position: fixed;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                font-size: 5rem;
                font-weight: 900;
                color: #FFD700;
                text-shadow: 
                    0 0 10px #FFD700,
                    0 0 20px #FFD700,
                    0 0 30px #FFA500,
                    3px 3px 0 #000,
                    -3px -3px 0 #000,
                    3px -3px 0 #000,
                    -3px 3px 0 #000;
                z-index: 1001;
                animation: champion-float 2s ease-in-out infinite;
                text-align: center;
                letter-spacing: 5px;
            }
            
            .trophy-icon {
                position: fixed;
                font-size: 8rem;
                top: 40%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1001;
                animation: trophy-spin 1.5s ease-out forwards;
                filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.8));
            }
        `;
        document.head.appendChild(style);
    }
    
    // 🏆 Phase 1: Trophy appears
    setTimeout(() => {
        const trophy = document.createElement('div');
        trophy.className = 'trophy-icon';
        trophy.innerHTML = '🏆';
        confettiContainer.appendChild(trophy);
        setTimeout(() => trophy.remove(), 3000);
    }, 300);
    
    // 🎊 Phase 2: Massive metallic confetti explosion
    setTimeout(() => {
        createMetallicExplosion(confettiContainer, 300);
    }, 800);
    
    // 🥇 Phase 3: Champion text
    setTimeout(() => {
        const champText = document.createElement('div');
        champText.className = 'champion-text';
        champText.innerHTML = 'CHAMPION!';
        confettiContainer.appendChild(champText);
        setTimeout(() => champText.remove(), 3000);
    }, 1500);
    
    // ⭐ Phase 4: Golden ticker tape
    setTimeout(() => {
        createTickerTape(confettiContainer, 200);
    }, 2000);
    
    // 🎉 Phase 5: Continuous stadium rain
    setTimeout(() => {
        createStadiumRain(confettiContainer, 400);
    }, 2500);
    
    // 💫 Phase 6: Sparkle effects
    setTimeout(() => {
        createSparkles(confettiContainer, 100);
    }, 3500);
    
    // 🌟 Phase 7: Final victory burst
    setTimeout(() => {
        createVictoryBurst(confettiContainer, 500);
        const finalText = document.createElement('div');
        finalText.className = 'champion-text';
        finalText.innerHTML = 'PROMOTED! 🎊';
        finalText.style.fontSize = '4rem';
        confettiContainer.appendChild(finalText);
        setTimeout(() => finalText.remove(), 3000);
    }, 4500);
}

function createMetallicExplosion(container, count) {
    console.log('💥 Metallic explosion');
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            const size = Math.random() * 15 + 10;
            const angle = (Math.PI * 2 * i) / count;
            const velocity = Math.random() * 300 + 200;
            
            confetti.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${getMetallicColor()};
                top: 50%;
                left: 50%;
                border-radius: ${Math.random() > 0.6 ? '50%' : '0'};
                animation: champion-fall ${Math.random() * 3 + 2}s ease-out forwards;
                box-shadow: 0 0 ${size}px ${getMetallicGlow()};
                transform-origin: center;
            `;
            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }, i * 3);
    }
}

function createTickerTape(container, count) {
    console.log('🎗️ Ticker tape');
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const tape = document.createElement('div');
            tape.style.cssText = `
                position: absolute;
                width: ${Math.random() * 30 + 15}px;
                height: ${Math.random() * 80 + 60}px;
                background: linear-gradient(180deg, 
                    ${getChampionColor()} 0%, 
                    ${getChampionColor()} 50%, 
                    ${getChampionColor()} 100%);
                top: -100px;
                left: ${Math.random() * 100}%;
                animation: champion-fall ${Math.random() * 4 + 3}s linear forwards;
                opacity: 0.9;
                box-shadow: 0 0 20px ${getMetallicGlow()};
            `;
            container.appendChild(tape);
            setTimeout(() => tape.remove(), 7000);
        }, i * 30);
    }
}

function createStadiumRain(container, count) {
    console.log('🌧️ Stadium rain');
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            const size = Math.random() * 12 + 8;
            confetti.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${getChampionColor()};
                top: -20px;
                left: ${Math.random() * 100}%;
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                animation: champion-fall ${Math.random() * 5 + 4}s linear forwards;
                box-shadow: 0 0 10px ${getMetallicGlow()};
            `;
            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 9000);
        }, i * 50);
    }
}

function createSparkles(container, count) {
    console.log('✨ Sparkles');
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.innerHTML = '✨';
            sparkle.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 30 + 20}px;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: sparkle ${Math.random() * 2 + 1}s ease-in-out infinite;
                z-index: 1001;
                filter: drop-shadow(0 0 5px gold);
            `;
            container.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 4000);
        }, i * 40);
    }
}

function createVictoryBurst(container, count) {
    console.log('🚀 Victory burst');
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            const size = Math.random() * 20 + 12;
            confetti.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${getMetallicColor()};
                top: ${Math.random() * 30}%;
                left: ${Math.random() * 100}%;
                border-radius: 50%;
                animation: champion-fall ${Math.random() * 4 + 3}s ease-out forwards;
                box-shadow: 0 0 20px ${getMetallicGlow()}, 0 0 40px ${getMetallicGlow()};
            `;
            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 7000);
        }, i * 8);
    }
}

// Champion trophy colors - Gold, Silver, Bronze metallic
function getMetallicColor() {
    const metallics = [
        '#FFD700', // Pure Gold
        '#FFA500', // Orange Gold
        '#FFDF00', // Bright Gold
        '#FFE55C', // Light Gold
        '#C0C0C0', // Silver
        '#E8E8E8', // Bright Silver
        '#CD7F32', // Bronze
        '#FFFFFF', // White (confetti paper)
        '#F8F8FF'  // Ghost White
    ];
    return metallics[Math.floor(Math.random() * metallics.length)];
}

// Bold champion colors
function getChampionColor() {
    const champions = [
        '#FFD700', // Gold
        '#FFA500', // Orange
        '#FF4500', // Red-Orange  
        '#C0C0C0', // Silver
        '#FFFFFF', // White
        '#00FF00', // Bright Green
        '#0000FF', // Blue
        '#FF1493'  // Deep Pink
    ];
    return champions[Math.floor(Math.random() * champions.length)];
}

function getMetallicGlow() {
    const glows = [
        'rgba(255, 215, 0, 0.8)',  // Gold glow
        'rgba(255, 165, 0, 0.8)',  // Orange glow
        'rgba(192, 192, 192, 0.8)', // Silver glow
        'rgba(255, 255, 255, 0.8)'  // White glow
    ];
    return glows[Math.floor(Math.random() * glows.length)];
}

console.log('✅ Champion celebration system ready! 🏆');