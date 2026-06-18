var ch = [1500, 1500, 1000, 1500, 1000, 1000, 1000, 1000, 1000, 1000]; 
var ws;

function connectWS() {
    // تم تثبيت الآي بي الخاص بالـ ESP32 ليعمل داخل الـ APK مباشرة بدون متصفح
    ws = new WebSocket('ws://192.168.4.1:81/');
    ws.onopen = function() { 
        document.getElementById('connStatus').innerText = 'CONNECTED'; 
        document.getElementById('connStatus').style.color = '#39ff14'; 
    };
    ws.onclose = function() { 
        document.getElementById('connStatus').innerText = 'DISCONNECTED'; 
        document.getElementById('connStatus').style.color = '#ff5500'; 
        setTimeout(connectWS, 2000); 
    };
}

function updateHUD() {
    document.getElementById('val_ch0').innerText = ch[0]; 
    document.getElementById('val_ch1').innerText = ch[1]; 
    document.getElementById('val_ch2').innerText = ch[2]; 
    document.getElementById('val_ch3').innerText = ch[3]; 
    document.getElementById('val_ch4').innerText = ch[4]; 
    document.getElementById('val_ch5').innerText = ch[5]; 
    document.getElementById('val_ch6').innerText = ch[6]; 
    document.getElementById('val_ch7').innerText = ch[7]; 
    if(document.getElementById('val_ch8')) document.getElementById('val_ch8').innerText = ch[8];
    if(document.getElementById('val_ch9')) document.getElementById('val_ch9').innerText = ch[9];
}

function sendData() { 
    if(ws && ws.readyState === WebSocket.OPEN) { 
        ws.send(ch.join(',')); 
    } 
}

function setSwitchFromSelect(swName, value) {
    let intVal = parseInt(value);
    if (swName === 'swa') ch[4] = intVal; 
    else if (swName === 'swb') ch[5] = intVal; 
    else if (swName === 'swc') ch[6] = intVal; 
    else if (swName === 'swd') ch[7] = intVal;
    updateHUD(); 
    sendData();
}

function setupNativeJoystick(boxId, knobId, isLeftStick) {
    const box = document.getElementById(boxId); 
    const knob = document.getElementById(knobId); 
    let activePointerId = null;

    function handleMovement(clientX, clientY) {
        const rect = box.getBoundingClientRect(); 
        const centerX = rect.left + rect.width / 2; 
        const centerY = rect.top + rect.height / 2;
        let dx = clientX - centerX; 
        let dy = clientY - centerY; 
        const maxRadius = (box.clientWidth / 2) - (knob.clientWidth / 2);
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > maxRadius) { 
            let angle = Math.atan2(dy, dx); 
            dx = Math.cos(angle) * maxRadius; 
            dy = Math.sin(angle) * maxRadius; 
        }

        knob.style.transform = `translate(${dx}px, ${dy}px)`; 
        knob.style.boxShadow = '0 0 25px #ff5500';
        let percentX = dx / maxRadius; 
        let percentY = -dy / maxRadius;

        if (isLeftStick) { 
            let normY = (percentY + 1) / 2; 
            ch[2] = Math.round(1000 + normY * 1000); 
            ch[3] = Math.round(1500 + percentX * 500); 
        } else { 
            ch[0] = Math.round(1500 + percentX * 500); 
            ch[1] = Math.round(1500 + percentY * 500); 
        }
        updateHUD(); 
        sendData();
    }

    box.addEventListener('pointerdown', (e) => { if (activePointerId !== null) return; activePointerId = e.pointerId; box.setPointerCapture(e.pointerId); handleMovement(e.clientX, e.clientY); });
    box.addEventListener('pointermove', (e) => { if (e.pointerId === activePointerId) { handleMovement(e.clientX, e.clientY); } });
    
    const handleRelease = (e) => {
        if (e.pointerId === activePointerId) {
            box.releasePointerCapture(activePointerId); 
            activePointerId = null; 
            knob.style.boxShadow = '0 0 15px rgba(255, 85, 0, 0.6)';
            
            if (isLeftStick) { 
                ch[3] = 1500; 
                const maxRadius = (box.clientWidth / 2) - (knob.clientWidth / 2); 
                let currentPercentY = (ch[2] - 1500) / 500; 
                let currentDynamicDy = -currentPercentY * maxRadius; 
                knob.style.transform = `translate(0px, ${currentDynamicDy}px)`; 
            } else { 
                ch[0] = 1500; 
                ch[1] = 1500; 
                knob.style.transform = 'translate(0px, 0px)'; 
            }
            updateHUD(); 
            sendData();
        }
    };
    box.addEventListener('pointerup', handleRelease); 
    box.addEventListener('pointercancel', handleRelease);
}

window.onload = function() { 
    setupNativeJoystick('leftJoystickBox', 'leftKnob', true); 
    setupNativeJoystick('rightJoystickBox', 'rightKnob', false); 
    connectWS(); 
};