    const canvas = document.getElementById("simCanvas");
    const ctx = canvas.getContext("2d");
    const thInput = document.getElementById("thInput");
    const tcInput = document.getElementById("tcInput");
    const cycleText = document.getElementById("cycleStage");
    const statusReport = document.getElementById("statusReport");

    // --- CONFIGURATION ---
    const centerX = canvas.width / 2;
    const centerY = 75;           // MOVED UP: More space from the container
    const baseCrankRadius = 65;   // Slightly smaller to prevent hitting the top
    const rodLength = 260;        
    const pistonWidth = 80;       
    const pistonHeight = 40;      
    const cylinderTop = 160;      // MOVED DOWN: Clearly separate from the flywheel
    const cylinderBottom = 565;
    const effectBaseY = 560; 
    
    let isRunning = false; // The sim starts running by default

    let angle = Math.PI / 2;
    const neutralAngle = Math.PI / 2;

    let particles = Array.from({ length: 40 }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, size: Math.random() * 2 + 1,
    reset() {
        this.x = centerX + (Math.random() - 0.5) * (pistonWidth - 10);
        this.y = cylinderBottom - Math.random() * 100;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
    }
    }));
    particles.forEach(p => p.reset());



    function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let Th = parseFloat(thInput.value) || 0;
    let Tc = parseFloat(tcInput.value) || 0;
    let isInvalid = Tc >= Th;
    let efficiency = 0;
    let speed = 0;
    
    let currentCrankRadius = 65;

    // Inside your draw() function
    let ThRaw = thInput.value;
    let TcRaw = tcInput.value;

    if (ThRaw === "" || TcRaw === "") {
        // If the simulation isn't running and boxes are empty, 
        // we let the reset message stay.
        if (isRunning) {
            statusReport.style.display = "block";
            statusReport.innerHTML = "<b>WAITING:</b> Enter temperatures to start.";
        }
    } else {
        // Only when numbers are present do we calculate efficiency
        let Th = parseFloat(ThRaw);
        let Tc = parseFloat(TcRaw);
        // ... your existing Th > Tc logic here
    }

    // --- DEFINE DYNAMIC COLORS ---
    let currentBoxColor = "#e67e22"; 
    let currentRodColor = "#777777"; 

    if (isInvalid) {
        statusReport.style.display = "block";
        statusReport.innerHTML = "<b>HALTED:</b> the temprature of hot reservoir must be higher than cold reservoi  .";
        cycleText.innerText = "No Temperature Gradient";
        cycleText.style.color = "#888";
        angle = neutralAngle;
    } else {
        statusReport.style.display = "none";
        efficiency = 1 - (Tc / Th);
        const minStroke = 20; 
    
        speed = 0.005 + (efficiency * 0.04); 
        document.getElementById("effText").innerText = (efficiency * 100).toFixed(1) + "%";
        
        cycleText.style.color = "#ffffff";
        let normAngle = angle % (Math.PI * 2);

        // CYCLE STAGE LOGIC
        if (normAngle >= 0 && normAngle < Math.PI) {
            // Compression stages (Blue)
            currentBoxColor = "#3498db";
            currentRodColor = "#3498db"; 
            cycleText.innerText = normAngle < Math.PI * 0.5 ? "3. Isothermal Compression" : "4. Adiabatic Compression";
        } else {
            // Expansion stages (Orange/Grey)
            currentBoxColor = "#e67e22";
            currentRodColor = "#777777";
            cycleText.innerText = normAngle < Math.PI * 1.5 ? "1. Isothermal Expansion" : "2. Adiabatic Expansion";
        }
    }

    const crankPinX = centerX + Math.cos(angle) * currentCrankRadius;
    const crankPinY = centerY + Math.sin(angle) * currentCrankRadius;
    const dx = crankPinX - centerX;
    const pistonPinY = crankPinY + Math.sqrt(rodLength**2 - dx**2);
    const pistonBottomY = pistonPinY + pistonHeight - 10;

    // 1. Draw Reservoir Box (Only visible during Isothermal stages)
    let normAngle = angle % (Math.PI * 2);
    
    // Stage 1: Isothermal Expansion (Math.PI to ~1.5*Math.PI)
    // Stage 3: Isothermal Compression (0 to ~0.5*Math.PI)
    const isIsothermalExpansion = normAngle >= Math.PI && normAngle < Math.PI * 1.5;
    const isIsothermalCompression = normAngle >= 0 && normAngle < Math.PI * 0.5;

    if (isIsothermalExpansion || isIsothermalCompression) {
        ctx.beginPath();
        let boxGrad = ctx.createLinearGradient(0, effectBaseY, 0, canvas.height);
        boxGrad.addColorStop(0, currentBoxColor);
        boxGrad.addColorStop(1, "#1a1a1a");
        ctx.fillStyle = boxGrad;
        
        if (ctx.roundRect) ctx.roundRect(centerX - 140, effectBaseY, 280, 120, 15);
        else ctx.fillRect(centerX - 140, effectBaseY, 280, 120);
        
        ctx.fill();
    }

    // 2. Cylinder and Gas
    ctx.fillStyle = "rgba(100, 100, 255, 0.05)";
    ctx.fillRect(centerX - pistonWidth/2, pistonBottomY, pistonWidth, cylinderBottom - pistonBottomY);
    ctx.strokeStyle = "#444"; ctx.lineWidth = 8;
    ctx.strokeRect(centerX - pistonWidth/2, cylinderTop, pistonWidth, cylinderBottom - cylinderTop);

    // 3. Particles
    particles.forEach(p => {
        if (!isInvalid) { p.x += p.vx; p.y += p.vy; }
        if (p.x < centerX - pistonWidth/2 || p.x > centerX + pistonWidth/2) p.vx *= -1;
        if (p.y > cylinderBottom) p.y = cylinderBottom - 2, p.vy *= -1;
        if (p.y < pistonBottomY) p.y = pistonBottomY + 2, p.vy *= -1;
        ctx.fillStyle = currentBoxColor;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });

    // 4. Rotating Flywheel
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.fillStyle = "#333"; ctx.arc(0, 0, baseCrankRadius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#555"; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.strokeStyle = "#444"; 
    ctx.moveTo(-baseCrankRadius, 0); ctx.lineTo(baseCrankRadius, 0);
    ctx.moveTo(0, -baseCrankRadius); ctx.lineTo(0, baseCrankRadius); ctx.stroke();
    ctx.restore();

    // 5. Connecting Rod (FIXED COLOR LOGIC)
    ctx.beginPath();
    ctx.strokeStyle = currentRodColor;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.moveTo(crankPinX, crankPinY);
    ctx.lineTo(centerX, pistonPinY);
    ctx.stroke();

    // 6. Piston
    ctx.fillStyle = "#f1c40f"; 
    ctx.fillRect(centerX - pistonWidth/2, pistonPinY - 10, pistonWidth, pistonHeight);
    
    // 7. Red Crank Arm
    ctx.beginPath(); ctx.strokeStyle = "#e74c3c"; ctx.lineWidth = 8;
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(crankPinX, crankPinY);
    ctx.stroke();

    if(isRunning){
    angle += speed;}
    requestAnimationFrame(draw);
    }
    draw();
    function startSim() {
    isRunning = true;
    }

    function pauseSim() {
        isRunning = false;
    }
    function resumeSim() {
        isRunning = true;
    }

    function resetSim() {
    isRunning = false;
    angle = Math.PI / 2;
    thInput.value = ""; 
    tcInput.value = "";
    
    function showState(text){

        if(efficiency<50){
            statusReport.style.display = "block";
        }

        else{
    }
    }
    
    // Use a specific "Reset" state text
    statusReport.style.display = "block";
    statusReport.innerHTML = "<b>RESET COMPLETE:</b> Please enter $T_H$ and $T_C$ values to begin.";
}

