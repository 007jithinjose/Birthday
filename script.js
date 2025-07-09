document.addEventListener('DOMContentLoaded', function() {
    // Get CSS variables for confetti colors
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--primary').trim();
    const primaryVariantColor = rootStyles.getPropertyValue('--primary-variant').trim();
    const secondaryColor = rootStyles.getPropertyValue('--secondary').trim();

    // Register ALL GSAP plugins needed for the entire page
    // Ensure Observer, MorphSVGPlugin, Physics2DPlugin, Draggable, InertiaPlugin are included
    gsap.registerPlugin(Observer, MorphSVGPlugin, Physics2DPlugin, Draggable, InertiaPlugin);

    // Music toggle functionality
    const audio = document.getElementById('birthdayAudio');
    const musicToggle = document.querySelector('.music-toggle');
    let isPlaying = false; // Controls audio playback state
    let audioInitiatedOnce = false; // Tracks if audio playback (muted or unmuted) has been attempted

    // --- Play/Pause Icon Morphing Setup ---
    const playPath =
        "M3.5 5L3.50049 3.9468C3.50049 3.177 4.33382 2.69588 5.00049 3.08078L20.0005 11.741C20.6672 12.1259 20.6672 13.0882 20.0005 13.4731L17.2388 15.1412L17.0055 15.2759M3.50049 8L3.50049 21.2673C3.50049 22.0371 4.33382 22.5182 5.00049 22.1333L14.1192 16.9423L14.4074 16.7759";
    const pausePath =
        "M15.5004 4.05859V5.0638V5.58691V8.58691V15.5869V19.5869V21.2549M8.5 3.96094V10.3721V17V19L8.5 21";

    let iconPath;
    if (musicToggle) { // Check if musicToggle exists before trying to query its children
        if (musicToggle.querySelector('.play-pause-icon') && musicToggle.querySelector('[data-play-pause="path"]')) {
            iconPath = musicToggle.querySelector('[data-play-pause="path"]');
        } else {
            const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            svgIcon.setAttribute("width", "100%");
            svgIcon.setAttribute("viewBox", "0 0 24 25");
            svgIcon.setAttribute("fill", "none");
            svgIcon.classList.add("play-pause-icon");

            iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            iconPath.setAttribute("d", playPath); // Start with the play path
            iconPath.setAttribute("stroke", "currentColor");
            iconPath.setAttribute("stroke-width", "2");
            iconPath.setAttribute("stroke-miterlimit", "16");
            iconPath.setAttribute("data-play-pause", "path");
            iconPath.setAttribute("stroke-linecap", "round");

            svgIcon.appendChild(iconPath);
            musicToggle.innerHTML = '';
            musicToggle.appendChild(svgIcon);
        }
    }
    // --- End Play/Pause Icon Morphing Setup ---


    // Function to attempt playing audio unmuted
    function enableAudio() {
        if (audioInitiatedOnce && !audio.muted) {
            return;
        }

        audio.muted = false;
        audio.play()
            .then(() => {
                isPlaying = true;
                audioInitiatedOnce = true;
                console.log("Audio playing (unmuted)");
                removeInitialInteractionListeners();
                gsap.to(iconPath, {
                    duration: 0.5,
                    morphSVG: {
                        type: "rotational",
                        map: "complexity",
                        shape: pausePath
                    },
                    ease: "power4.inOut"
                });
            })
            .catch(error => {
                console.log("Unmuted playback failed after interaction:", error);
                isPlaying = false;
                audio.muted = true;
                gsap.to(iconPath, {
                    duration: 0.5,
                    morphSVG: {
                        type: "rotational",
                        map: "complexity",
                        shape: playPath
                    },
                    ease: "power4.inOut"
                });
            });
    }

    // Function to remove the one-time global interaction listeners
    function removeInitialInteractionListeners() {
        document.body.removeEventListener('click', handleFirstInteraction);
        const audioObserver = Observer.getById("audioUnmuteObserver");
        if (audioObserver) {
            audioObserver.kill();
            console.log("Audio unmute observer killed.");
        }
    }

    // Function to handle the very first user interaction
    function handleFirstInteraction() {
        if (!audioInitiatedOnce) {
            console.log("First user interaction detected. Attempting to unmute audio.");
            enableAudio();
        }
    }

    function setupAudioInteraction() {
        // 1. Attempt muted autoplay immediately on page load.
        audio.muted = true;
        audio.play()
            .then(() => {
                console.log("Muted autoplay successful.");
                isPlaying = true;
                audioInitiatedOnce = true;
                // Only set morphSVG if iconPath exists
                if (iconPath) {
                    gsap.set(iconPath, { morphSVG: pausePath }); // Set to pause icon initially as audio is playing (muted)
                }

                // If muted autoplay works, wait for *any* first user interaction to unmute.
                // These listeners will be removed once audio is unmuted.
                document.body.addEventListener('click', handleFirstInteraction, { once: true });
                Observer.create({
                    id: "audioUnmuteObserver",
                    type: "wheel,touch,pointer",
                    onUp: handleFirstInteraction,
                    onDown: handleFirstInteraction,
                    tolerance: 10,
                    once: true
                });

            })
            .catch(mutedError => {
                console.log("Muted autoplay failed:", mutedError);
                // Only set morphSVG if iconPath exists
                if (iconPath) {
                    gsap.set(iconPath, { morphSVG: playPath }); // Set to play icon if cannot autoplay at all
                }
                isPlaying = false;
                audioInitiatedOnce = false;

                // Still need to listen for a first interaction to start playback
                document.body.addEventListener('click', handleFirstInteraction, { once: true });
                Observer.create({
                    id: "audioUnmuteObserver",
                    type: "wheel,touch,pointer",
                    onUp: handleFirstInteraction,
                    onDown: handleFirstInteraction,
                    tolerance: 10,
                    once: true
                });
            });

        // 2. Music toggle button behavior (primary control after initial setup)
        // Ensure musicToggle exists before adding event listener
        if (musicToggle) {
            musicToggle.addEventListener('click', function(e) {
                e.stopPropagation();

                // If audio has not been initiated (unmuted) by any interaction yet,
                // this click on the button will serve as the first interaction.
                if (!audioInitiatedOnce) {
                    console.log("Music toggle clicked as initial audio interaction.");
                    enableAudio(); // This will attempt to unmute and play, also updating the icon
                } else {
                    // If audio has already been initiated, proceed with standard toggle
                    if (isPlaying) {
                        audio.pause();
                        isPlaying = false;
                        gsap.to(iconPath, {
                            duration: 0.5,
                            morphSVG: {
                                type: "rotational",
                                map: "complexity",
                                shape: playPath
                            },
                            ease: "power4.inOut"
                        });
                        console.log("Audio paused");
                    } else {
                        audio.muted = false;
                        audio.play()
                            .then(() => {
                                isPlaying = true;
                                gsap.to(iconPath, {
                                    duration: 0.5,
                                    morphSVG: {
                                        type: "rotational",
                                        map: "complexity",
                                        shape: pausePath
                                    },
                                    ease: "power4.inOut"
                                });
                                console.log("Audio playing");
                            })
                            .catch(error => {
                                console.log("Direct playback failed (already initiated):", error);
                                gsap.to(iconPath, {
                                    duration: 0.5,
                                    morphSVG: {
                                        type: "rotational",
                                        map: "complexity",
                                        shape: playPath
                                    },
                                    ease: "power4.inOut"
                                });
                                isPlaying = false;
                                audio.muted = true;
                            });
                    }
                }

                // --- Confetti Burst on Click (from button) ---
                const buttonRect = musicToggle.getBoundingClientRect();
                const startX = buttonRect.left + buttonRect.width / 2;
                const startY = buttonRect.top + buttonRect.height / 2;

                const burstDotCount = gsap.utils.random(20, 40, 1); // More dots for burst
                const burstColors = [primaryColor, secondaryColor, '#ff7597', primaryVariantColor, '#018786']; // Reuse colors

                for (let i = 0; i < burstDotCount; i++) {
                    const dot = document.createElement("div");
                    dot.classList.add("dot", "button-burst-confetti"); // Add specific class
                    document.querySelector('.confetti-container').appendChild(dot);

                    gsap.set(dot, {
                        backgroundColor: gsap.utils.random(burstColors),
                        width: '1.5vw', // Larger size for burst
                        height: '1.5vw', // Larger size for burst
                        borderRadius: '50%', // Always circular for burst
                        x: startX,
                        y: startY,
                        scale: 0
                    });

                    gsap.timeline({ onComplete: () => dot.remove() })
                        .to(dot, {
                            scale: gsap.utils.random(0.5, 1.5), // Larger initial scale for burst
                            duration: 0.2,
                            ease: "power3.out"
                        })
                        .to(dot, {
                            duration: gsap.utils.random(0.8, 1.5), // Shorter duration for faster fall
                            physics2D: {
                                velocity: gsap.utils.random(300, 600), // Higher velocity for a "burst"
                                angle: gsap.utils.random(0, 360),
                                gravity: gsap.utils.random(800, 1200) // Higher gravity for faster fall
                            },
                            rotation: gsap.utils.random(0, 720), // Add rotation
                            autoAlpha: 0,
                            ease: "power1.out" // Stronger ease out for burst fade
                        }, "<");
                }
                // --- End Confetti Burst (from button) ---
            });
        }
    }

    // --- Function for Continuous Falling Confetti with Party Popper Effect (Increased Quantity & Full Width) ---
    function startContinuousConfettiPoppers() {
        const confettiContainer = document.querySelector('.confetti-container');
        const continuousColors = [primaryColor, secondaryColor, '#ff7597', primaryVariantColor, '#018786'];

        function createConfettiParticle() {
            const dot = document.createElement("div");
            dot.classList.add("dot", "continuous-popper-confetti"); // Add specific class
            confettiContainer.appendChild(dot);

            // Source point for the "popper" effect (full width, slightly above the top edge)
            const popperStartX = gsap.utils.random(0, window.innerWidth);
            const popperStartY = -20; // Start slightly above the top edge

            // Wavy Confetti Dimensions
            const width = gsap.utils.random(0.6, 1.2, 0.1) + 'vw'; // Slightly larger width range
            const height = gsap.utils.random(0.3, 0.8, 0.1) + 'vw'; // Shorter height for wavy effect
            // Randomize a few border-radius patterns for waviness
            const wavyBorderRadius = gsap.utils.random([
                '50% 10% 50% 10% / 10% 50% 10% 50%', // More abstract wavy
                '60% 40% 60% 40% / 30% 70% 30% 70%', // Gentler wave
                '70% 30% 70% 30% / 50% 50% 50% 50%', // More blob-like
                '80% 20% 80% 20% / 20% 80% 20% 80%', // Elongated
                '75% 25%', // Simple pill shape
                '50% 0% 50% 0%', // Half-circle on one side
                '0% 50% 0% 50%' // Half-circle on other side
            ]);


            const initialVelocity = gsap.utils.random(150, 250);
            const initialAngle = gsap.utils.random(225, 315);
            const particleGravity = gsap.utils.random(400, 600);
            const fadeDuration = gsap.utils.random(0.5, 1.5);

            gsap.set(dot, {
                backgroundColor: gsap.utils.random(continuousColors),
                width: width,
                height: height,
                borderRadius: wavyBorderRadius, // Apply the wavy border-radius
                x: popperStartX,
                y: popperStartY,
                rotation: gsap.utils.random(0, 360), // Initial random rotation
                opacity: 1
            });

            gsap.timeline({
                onComplete: () => dot.remove()
            })
            .to(dot, {
                duration: gsap.utils.random(2, 4),
                physics2D: {
                    velocity: initialVelocity,
                    angle: initialAngle,
                    gravity: particleGravity
                },
                rotation: "+=" + gsap.utils.random(720, 1440),
                ease: "power1.out"
            })
            .to(dot, {
                opacity: 0,
                duration: fadeDuration,
                ease: "power1.out"
            }, "-=" + fadeDuration * 0.5);
        }

        setInterval(createConfettiParticle, 25);
    }
    // --- End Function for Continuous Falling Confetti with Party Popper Effect ---

    // --- Draggable Birthday Cake and Following Farsu Functionality ---
    function initDraggableElements() {
        const cakeImage = document.querySelector('.cake-image');
        const farsuImage = document.querySelector('.farsu-image'); // Get the Farsu image
        const glossyBackground = document.querySelector('#draggable-cake-section');

        if (!cakeImage || !glossyBackground || !farsuImage) {
            console.warn("One or more draggable elements or their container not found. Draggable functionality will not be initialized.");
            return;
        }

        // Set transform-origin immediately for both images
        gsap.set(cakeImage, { transformOrigin: "top left" });
        gsap.set(farsuImage, { transformOrigin: "top left" });

        let cakeMovementTween; // Variable to hold the cake's random movement tween
        let farsuMovementTween; // Variable to hold Farsu's random movement tween
        let cakeDraggableInstance; // Variable to hold the Cake Draggable instance
        let farsuDraggableInstance; // Variable to hold the Farsu Draggable instance

        function setupInteractions() {
            // Create the Draggable instance for the Cake.
            cakeDraggableInstance = Draggable.create(cakeImage, {
                type: "x,y",
                bounds: glossyBackground,
                inertia: {
                    bounce: 0.5
                },
                edgeResistance: 0.7,
                onPress: function() {
                    if (cakeMovementTween) {
                        cakeMovementTween.kill();
                    }
                    if (farsuMovementTween) { // Also kill Farsu's movement when cake is pressed
                        farsuMovementTween.kill();
                    }
                    gsap.to(this.target, { scale: 1.1, duration: 0.1, ease: "power2.out" });
                    // When cake is dragged, Farsu should follow instantly without its own random movement
                    gsap.to(farsuImage, {
                        x: this.x + gsap.utils.random(-10, 10), // Offset slightly, reduced shaking
                        y: this.y + gsap.utils.random(-10, 10), // Offset slightly, reduced shaking
                        duration: 0.1, // Instant follow
                        overwrite: true
                    });
                },
                onDrag: function() {
                    // During drag, Farsu follows the cake
                    gsap.to(farsuImage, {
                        x: this.x + gsap.utils.random(-10, 10), // Offset slightly, reduced shaking
                        y: this.y + gsap.utils.random(-10, 10), // Offset slightly, reduced shaking
                        duration: 0.1, // Keep it snappy
                        overwrite: true
                    });
                },
                onRelease: function() {
                    gsap.to(this.target, { scale: 1, duration: 0.2, ease: "power2.out" });
                    startRandomMovement(this.target, this, 'cake'); // Restart cake's random movement
                },
                onDragEnd: function() {
                    startRandomMovement(this.target, this, 'cake'); // Ensure movement restarts
                },
                onThrowUpdate: function() { // Keep Farsu following during cake's inertia
                    gsap.set(farsuImage, {
                        x: this.x + gsap.utils.random(-10, 10), // Reduced shaking
                        y: this.y + gsap.utils.random(-10, 10)  // Reduced shaking
                    });
                }
            })[0];

            // Create the Draggable instance for Farsu image.
            // Farsu will primarily follow the cake, but can also be dragged independently.
            farsuDraggableInstance = Draggable.create(farsuImage, {
                type: "x,y",
                bounds: glossyBackground,
                inertia: {
                    bounce: 0.8 // More bouncy for a "livelier" follow
                },
                edgeResistance: 0.8,
                onPress: function() {
                    if (farsuMovementTween) {
                        farsuMovementTween.kill();
                    }
                    gsap.to(this.target, { scale: 1.2, duration: 0.1, ease: "power2.out" });
                },
                onRelease: function() {
                    gsap.to(this.target, { scale: 1, duration: 0.2, ease: "power2.out" });
                    // After manual drag, resume following the cake's position if it's moving
                    if (cakeMovementTween && cakeMovementTween.isActive()) {
                        startFollowingCake(this.target, this, cakeDraggableInstance);
                    } else {
                        // If cake is static after its own movement, start Farsu's random movement relative to it
                        startRandomMovement(this.target, this, 'farsu');
                    }
                },
                onDragEnd: function() {
                    if (cakeMovementTween && cakeMovementTween.isActive()) {
                        startFollowingCake(this.target, this, cakeDraggableInstance);
                    } else {
                        startRandomMovement(this.target, this, 'farsu');
                    }
                }
            })[0];

            // Set initial positions (center for cake, slightly offset for farsu)
            const centerX = (cakeDraggableInstance.maxX + cakeDraggableInstance.minX) / 2;
            const centerY = (cakeDraggableInstance.maxY + cakeDraggableInstance.minY) / 2;

            cakeDraggableInstance.x = centerX;
            cakeDraggableInstance.y = centerY;
            cakeDraggableInstance.update();

            farsuDraggableInstance.x = centerX + gsap.utils.random(-30, 30); // Start farsu near cake
            farsuDraggableInstance.y = centerY + gsap.utils.random(-30, 30);
            farsuDraggableInstance.update();

            // Start the initial random movement for the cake
            startRandomMovement(cakeImage, cakeDraggableInstance, 'cake');
            // Farsu will start following the cake right away
            startFollowingCake(farsuImage, farsuDraggableInstance, cakeDraggableInstance);
        }

        // Function to start either random movement or following behavior
        function startRandomMovement(target, draggable, type) {
            const buffer = 20;

            let currentTween;
            if (type === 'cake') {
                currentTween = cakeMovementTween;
            } else { // type === 'farsu'
                currentTween = farsuMovementTween;
            }

            if (currentTween) {
                currentTween.kill();
            }

            const targetX = gsap.utils.random(
                draggable.minX + buffer,
                draggable.maxX - buffer
            );
            const targetY = gsap.utils.random(
                draggable.minY + buffer,
                draggable.maxY - buffer
            );

            const velocity = gsap.utils.random(200, 400); // Slightly less velocity for independent random movement
            const angle = Math.atan2(targetY - draggable.y, targetX - draggable.x) * 180 / Math.PI;

            currentTween = gsap.to(target, {
                duration: gsap.utils.random(1.5, 3), // Longer duration for more gentle movement
                physics2D: {
                    velocity: velocity,
                    angle: angle,
                    gravity: 0,
                    friction: 0.1,
                    bounce: draggable.vars.inertia.bounce
                },
                ease: "none",
                onComplete: () => {
                    startRandomMovement(target, draggable, type); // Loop the random movement
                },
                overwrite: "auto"
            });

            if (type === 'cake') {
                cakeMovementTween = currentTween;
            } else {
                farsuMovementTween = currentTween;
            }
        }

        // Function for Farsu to follow the cake
        function startFollowingCake(farsuTarget, farsuDraggable, cakeDraggable) {
            if (farsuMovementTween) {
                farsuMovementTween.kill(); // Kill any existing independent movement
            }

            // Instead of an Observer on the cake's target, which might only fire on interaction,
            // let's create a continuous tween for Farsu that always aims for the cake's position.
            // This makes Farsu 'chase' the cake.
            farsuMovementTween = gsap.to(farsuTarget, {
                duration: 0.8, // How quickly Farsu tries to catch up (adjust as needed)
                ease: "power2.out", // Smooth easing for the chase
                repeat: -1, // Keep repeating indefinitely
                onUpdate: function() {
                    // Calculate a target position for Farsu relative to the cake
                    const cakeX = cakeDraggable.x;
                    const cakeY = cakeDraggable.y;

                    // Add some subtle random offset for a playful follow, reduced to lessen "shaking"
                    const offsetX = gsap.utils.random(-10, 10);
                    const offsetY = gsap.utils.random(-10, 10);

                    const farsuTargetX = cakeX + offsetX;
                    const farsuTargetY = cakeY + offsetY;

                    // Ensure Farsu stays within its own bounds
                    const constrainedX = gsap.utils.clamp(farsuDraggable.minX, farsuDraggable.maxX, farsuTargetX);
                    const constrainedY = gsap.utils.clamp(farsuDraggable.minY, farsuDraggable.maxY, farsuTargetY);

                    // Update Farsu's position directly or use a subtle physics tween for the next small step
                    // Using a small physics tween here can create the bouncy effect.
                    gsap.to(farsuTarget, {
                        x: constrainedX,
                        y: constrainedY,
                        duration: 0.3, // Short duration for a responsive follow
                        physics2D: {
                            velocity: 100, // Small velocity
                            angle: Math.atan2(constrainedY - farsuDraggable.y, constrainedX - farsuDraggable.x) * 180 / Math.PI,
                            gravity: 0,
                            friction: 0.1,
                            bounce: farsuDraggable.vars.inertia.bounce * 0.5 // Less bounce for smoother follow
                        },
                        ease: "none", // Let physics handle the easing
                        overwrite: true // Important to avoid conflicts
                    });
                },
                overwrite: "auto" // This tween itself should be overwriteable
            });

            // Add a listener to the cake's Draggable instance to ensure Farsu's follow is active
            // whenever the cake is dragged or thrown.
            cakeDraggable.addEventListener("drag", () => {
                // When cake is dragged, Farsu should follow instantly, cancelling its physics tween briefly
                gsap.to(farsuTarget, {
                    x: cakeDraggable.x + gsap.utils.random(-10, 10),
                    y: cakeDraggable.y + gsap.utils.random(-10, 10),
                    duration: 0.1, // Instant follow during drag
                    overwrite: true
                });
                // Ensure the main following tween is active
                if (farsuMovementTween && !farsuMovementTween.isActive()) {
                    farsuMovementTween.restart(true);
                }
            });

            cakeDraggable.addEventListener("throwUpdate", () => {
                // During throw (inertia), Farsu continues to follow
                gsap.to(farsuTarget, {
                    x: cakeDraggable.x + gsap.utils.random(-10, 10),
                    y: cakeDraggable.y + gsap.utils.random(-10, 10),
                    duration: 0.1, // Keep it snappy
                    overwrite: true
                });
                // Ensure the main following tween is active
                if (farsuMovementTween && !farsuMovementTween.isActive()) {
                    farsuMovementTween.restart(true);
                }
            });

            // When cake stops moving (either by drag end or random tween completion),
            // Farsu should check its state.
            cakeDraggable.addEventListener("dragend", () => {
                if (!cakeDraggable.isDragging) { // If cake is no longer being dragged
                    // Resume the continuous follow tween or restart its random movement if cake is truly idle
                    if (farsuMovementTween) {
                        farsuMovementTween.restart(true); // Restart the chase
                    } else {
                        // Fallback in case tween was killed unexpectedly
                        startRandomMovement(farsuTarget, farsuDraggable, 'farsu');
                    }
                }
            });

            // Also add a listener for when the cake's *random movement* tween completes
            // This is important because the cake's movement isn't only from user drag/throw.
            // For simplicity, let's assume `cakeMovementTween` is accessible.
            if (cakeMovementTween) {
                cakeMovementTween.eventCallback("onComplete", () => {
                    // When cake's random movement stops, and it's not being dragged,
                    // Farsu should start its own random movement if not already following.
                    if (!cakeDraggable.isDragging && !farsuDraggable.isDragging) {
                        startRandomMovement(farsuTarget, farsuDraggable, 'farsu');
                    }
                });
            }
        }

        // Delay the setup slightly to ensure all CSS and layout are fully rendered.
        gsap.delayedCall(0.2, setupInteractions); // 200ms delay
    }
    // --- End Draggable Birthday Cake and Following Farsu Functionality ---

    // Slideshow Initialization Function
    function initSlideshow() {
        const sections = gsap.utils.toArray(".slide");
        const images = gsap.utils.toArray(".image").reverse();
        const slideImages = gsap.utils.toArray(".slide__img");
        const outerWrappers = gsap.utils.toArray(".slide__outer");
        const innerWrappers = gsap.utils.toArray(".slide__inner");
        const count = document.querySelector(".count");
        const interactiveSection = document.querySelector(".interactive-section-wrapper");
        const wrap = gsap.utils.wrap(0, sections.length);
        let currentIndex = 0;
        let slideInterval;
        let animating = false;

        // Check if elements exist before setting GSAP properties
        if (outerWrappers.length) gsap.set(outerWrappers, { xPercent: 100 });
        if (innerWrappers.length) gsap.set(innerWrappers, { xPercent: -100 });

        const firstSlideOuter = document.querySelector(".slide:nth-of-type(1) .slide__outer");
        const firstSlideInner = document.querySelector(".slide:nth-of-type(1) .slide__inner");
        const firstSlideHeading = document.querySelector(".slide:nth-of-type(1) .slide__heading");

        if (firstSlideOuter) gsap.set(firstSlideOuter, { xPercent: 0 });
        if (firstSlideInner) gsap.set(firstSlideInner, { xPercent: 0 });
        if (firstSlideHeading) gsap.set(firstSlideHeading, { "--width": 200, xPercent: 0 });


        function gotoSection(index, direction) {
            if (animating) return;
            animating = true;

            index = wrap(index);

            let tl = gsap.timeline({
                defaults: { duration: 0.8, ease: "expo.inOut" },
                onComplete: () => {
                    animating = false;
                }
            });

            let currentSection = sections[currentIndex];
            let heading = currentSection ? currentSection.querySelector(".slide__heading") : null;
            let nextSection = sections[index];
            let nextHeading = nextSection ? nextSection.querySelector(".slide__heading") : null;

            gsap.set([sections, images], { zIndex: 0, autoAlpha: 0 });
            // Ensure elements exist before setting
            if (sections[currentIndex] && images[index]) {
                gsap.set([sections[currentIndex], images[index]], { zIndex: 1, autoAlpha: 1 });
            }
            if (sections[index] && images[currentIndex]) {
                gsap.set([sections[index], images[currentIndex]], { zIndex: 2, autoAlpha: 1 });
            }


            tl
                .to(count, {
                    innerText: index + 1,
                    duration: 0.4,
                    snap: { innerText: 1 },
                    ease: "power2.out"
                }, 0.25)
                .fromTo(
                    outerWrappers[index],
                    { xPercent: 100 * direction },
                    { xPercent: 0 },
                    0
                )
                .fromTo(
                    innerWrappers[index],
                    { xPercent: -100 * direction },
                    { xPercent: 0 },
                    0
                );

            if (heading) { // Only animate if heading exists
                tl.to(
                    heading,
                    { "--width": 800, xPercent: 30 * direction },
                    0
                );
            }

            if (nextHeading) { // Only animate if nextHeading exists
                tl.fromTo(
                    nextHeading,
                    { "--width": 800, xPercent: -30 * direction },
                    { "--width": 200, xPercent: 0 },
                    0
                );
            }

            tl
                .fromTo(
                    images[index],
                    { xPercent: 125 * direction, scaleX: 1.5, scaleY: 1.3 },
                    { xPercent: 0, scaleX: 1, scaleY: 1 },
                    0
                )
                .fromTo(
                    images[currentIndex],
                    { xPercent: 0, scaleX: 1, scaleY: 1 },
                    { xPercent: -125 * direction, scaleX: 1.5, scaleY: 1.3 },
                    0
                )
                .fromTo(
                    slideImages[index],
                    { scale: 2 },
                    { scale: 1 },
                    0
                );

            currentIndex = index;
            resetSlideInterval();
        }

        function startSlideInterval() {
            slideInterval = setInterval(() => gotoSection(currentIndex + 1, +1), 3000);
        }

        function resetSlideInterval() {
            clearInterval(slideInterval);
            startSlideInterval();
        }

        startSlideInterval();

        if (interactiveSection) { // Ensure interactiveSection exists before creating observer
            Observer.create({
                target: interactiveSection,
                type: "wheel,touch,pointer",
                preventDefault: true,
                wheelSpeed: -1,
                onUp: () => {
                    if (animating) return;
                    gotoSection(currentIndex + 1, +1);
                },
                onDown: () => {
                    if (animating) return;
                    gotoSection(currentIndex - 1, -1);
                },
                tolerance: 10
            });
        }

        document.addEventListener("keydown", function(e) {
            if (animating) return;

            if ((e.code === "ArrowUp" || e.code === "ArrowLeft")) {
                gotoSection(currentIndex - 1, -1);
            }
            if ((e.code === "ArrowDown" || e.code === "ArrowRight" || e.code === "Space" || e.code === "Enter")) {
                gotoSection(currentIndex + 1, 1);
            }
        });
    }

    // --- Function to initialize the Mouse Wave Gallery effect ---
    function initMouseWaveGallery() {
        let oldX = 0,
            oldY = 0,
            deltaX = 0,
            deltaY = 0

        const root = document.querySelector('.mwg_effect000')

        // Ensure root exists before adding event listener
        if (root) {
            root.addEventListener("mousemove", (e) => {
                // Calculate horizontal movement since the last mouse position
                deltaX = e.clientX - oldX;

                // Calculate vertical movement since the last mouse position
                deltaY = e.clientY - oldY;

                // Update old coordinates with the current mouse position
                oldX = e.clientX;
                oldY = e.clientY;
            })

            root.querySelectorAll('.media').forEach(el => {
                // Add an event listener for when the mouse enters each media
                el.addEventListener('mouseenter', () => {
                    const tl = gsap.timeline({
                        onComplete: () => {
                            tl.kill()
                        }
                    })
                    tl.timeScale(1.2) // Animation will play 20% faster than normal

                    const image = el.querySelector('img')
                    if (image) { // Ensure image exists
                        tl.to(image, {
                            inertia: {
                                x: {
                                    velocity: deltaX * 30, // Higher number = movement amplified
                                    end: 0 // Go back to the initial position
                                },
                                y: {
                                    velocity: deltaY * 30, // Higher number = movement amplified
                                    end: 0 // Go back to the initial position
                                },
                            },
                        })
                        tl.fromTo(image, {
                            rotate: 0
                        }, {
                            duration: 0.4,
                            rotate: (Math.random() - 0.5) * 30, // Returns a value between -15 & 15
                            yoyo: true,
                            repeat: 1,
                            ease: 'power1.inOut' // Will slow at the begin and the end
                        }, '<') // The animation starts at the same time as the previous tween
                    }
                })
            })
        } else {
            console.warn("Element with class 'mwg_effect000' not found. Mouse wave gallery effect will not be initialized.");
        }
    }

// --- Balloons Floating Effect ---
function initBalloons() {
    const container = document.querySelector('.balloons-container');
    if (!container) return;

    const colors = [
        '#ff7597', '#ff7eb3', '#ff65a3', 
        '#7afcff', '#feff9c', '#fff740',
        '#ff9a8b', '#ff65a5', '#ff6b8b',
        '#6fc3df', '#e0f9b5', '#a5dee5'
    ];
    const balloonCount = 15;
    let balloons = [];
    let balloonInterval;

    function createBalloon() {
        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        
        const string = document.createElement('div');
        string.className = 'balloon-string';
        
        balloon.appendChild(string);
        container.appendChild(balloon);
        
        // Random properties
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = gsap.utils.random(60, 100);
        const startX = gsap.utils.random(0, window.innerWidth);
        const startY = window.innerHeight + size;
        const floatDuration = gsap.utils.random(15, 25);
        const swayAmount = gsap.utils.random(50, 150);
        
        // Style the balloon
        balloon.style.backgroundColor = color;
        balloon.style.width = `${size}px`;
        balloon.style.height = `${size * 1.25}px`;
        
        // Initial position
        gsap.set(balloon, {
            x: startX,
            y: startY
        });
        
        // Floating animation
        const floatTween = gsap.to(balloon, {
            y: -size * 2,
            duration: floatDuration,
            ease: "none",
            onComplete: () => {
                // Remove balloon when it reaches top
                balloon.remove();
                balloons = balloons.filter(b => b.element !== balloon);
            }
        });
        
        // Swaying animation
        const swayTween = gsap.to(balloon, {
            x: `+=${swayAmount}`,
            duration: gsap.utils.random(3, 6),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
        
        // Click interaction
        balloon.addEventListener('click', (e) => {
            e.stopPropagation();
            popBalloon(balloon, e.clientX, e.clientY);
        });
        
        balloons.push({
            element: balloon,
            floatTween: floatTween,
            swayTween: swayTween
        });
    }

    function popBalloon(balloon, x, y) {
        // Create confetti burst
        const burstCount = 20;
        const burstParticles = [];
        const color = balloon.style.backgroundColor;
        
        for (let i = 0; i < burstCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'balloon-particle';
            particle.style.backgroundColor = color;
            container.appendChild(particle);
            
            gsap.set(particle, {
                x: x,
                y: y,
                width: '8px',
                height: '8px',
                borderRadius: '50%'
            });
            
            gsap.to(particle, {
                x: x + gsap.utils.random(-100, 100),
                y: y + gsap.utils.random(-100, 100),
                opacity: 0,
                duration: 1,
                onComplete: () => particle.remove()
            });
        }
        
        // Remove balloon
        const balloonObj = balloons.find(b => b.element === balloon);
        if (balloonObj) {
            balloonObj.floatTween.kill();
            balloonObj.swayTween.kill();
            balloons = balloons.filter(b => b !== balloonObj);
        }
        balloon.remove();
    }

    // Initial balloons
    for (let i = 0; i < balloonCount; i++) {
        createBalloon();
    }

    // Continuous balloon creation
    balloonInterval = setInterval(() => {
        if (balloons.length < balloonCount * 1.5) { // Keep some buffer
            createBalloon();
        }
    }, 2000);

    // Cleanup on window resize
    window.addEventListener('resize', () => {
        balloons.forEach(balloon => {
            balloon.floatTween.kill();
            balloon.swayTween.kill();
            balloon.element.remove();
        });
        balloons = [];
        clearInterval(balloonInterval);
        
        // Reinitialize
        for (let i = 0; i < balloonCount; i++) {
            createBalloon();
        }
        balloonInterval = setInterval(() => {
            if (balloons.length < balloonCount * 1.5) {
                createBalloon();
            }
        }, 2000);
    });
}
    // Initialize all functionalities when the DOM is ready
    setupAudioInteraction();
    initSlideshow();
    startContinuousConfettiPoppers();
    initDraggableElements(); // Initialize both draggable elements (cake and farsu)
    initMouseWaveGallery(); // Initialize the new mouse wave gallery section
    initBalloons();

});
