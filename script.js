document.addEventListener('DOMContentLoaded', function() {
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--primary').trim();
    const primaryVariantColor = rootStyles.getPropertyValue('--primary-variant').trim();
    const secondaryColor = rootStyles.getPropertyValue('--secondary').trim();
    gsap.registerPlugin(Observer, MorphSVGPlugin, Physics2DPlugin, Draggable, InertiaPlugin);

    const audio = document.getElementById('birthdayAudio');
    const musicToggle = document.querySelector('.music-toggle');
    let isPlaying = false; 
    let audioInitiatedOnce = false;

    const playPath =
        "M3.5 5L3.50049 3.9468C3.50049 3.177 4.33382 2.69588 5.00049 3.08078L20.0005 11.741C20.6672 12.1259 20.6672 13.0882 20.0005 13.4731L17.2388 15.1412L17.0055 15.2759M3.50049 8L3.50049 21.2673C3.50049 22.0371 4.33382 22.5182 5.00049 22.1333L14.1192 16.9423L14.4074 16.7759";
    const pausePath =
        "M15.5004 4.05859V5.0638V5.58691V8.58691V15.5869V19.5869V21.2549M8.5 3.96094V10.3721V17V19L8.5 21";

    let iconPath;
    if (musicToggle) { 
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
            iconPath.setAttribute("d", playPath);
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

    function removeInitialInteractionListeners() {
        document.body.removeEventListener('click', handleFirstInteraction);
        const audioObserver = Observer.getById("audioUnmuteObserver");
        if (audioObserver) {
            audioObserver.kill();
            console.log("Audio unmute observer killed.");
        }
    }

    function handleFirstInteraction() {
        if (!audioInitiatedOnce) {
            console.log("First user interaction detected. Attempting to unmute audio.");
            enableAudio();
        }
    }

    function setupAudioInteraction() {
        audio.muted = true;
        audio.play()
            .then(() => {
                console.log("Muted autoplay successful.");
                isPlaying = true;
                audioInitiatedOnce = true;
                if (iconPath) {
                    gsap.set(iconPath, { morphSVG: pausePath }); 
                }

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
                if (iconPath) {
                    gsap.set(iconPath, { morphSVG: playPath });
                }
                isPlaying = false;
                audioInitiatedOnce = false;

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

        if (musicToggle) {
            musicToggle.addEventListener('click', function(e) {
                e.stopPropagation();

                if (!audioInitiatedOnce) {
                    console.log("Music toggle clicked as initial audio interaction.");
                    enableAudio();
                } else {
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

                const buttonRect = musicToggle.getBoundingClientRect();
                const startX = buttonRect.left + buttonRect.width / 2;
                const startY = buttonRect.top + buttonRect.height / 2;

                const burstDotCount = gsap.utils.random(20, 40, 1);
                const burstColors = [primaryColor, secondaryColor, '#ff7597', primaryVariantColor, '#018786'];

                for (let i = 0; i < burstDotCount; i++) {
                    const dot = document.createElement("div");
                    dot.classList.add("dot", "button-burst-confetti");
                    document.querySelector('.confetti-container').appendChild(dot);

                    gsap.set(dot, {
                        backgroundColor: gsap.utils.random(burstColors),
                        width: '1.5vw',
                        height: '1.5vw',
                        borderRadius: '50%',
                        x: startX,
                        y: startY,
                        scale: 0
                    });

                    gsap.timeline({ onComplete: () => dot.remove() })
                        .to(dot, {
                            scale: gsap.utils.random(0.5, 1.5),
                            duration: 0.2,
                            ease: "power3.out"
                        })
                        .to(dot, {
                            duration: gsap.utils.random(0.8, 1.5),
                            physics2D: {
                                velocity: gsap.utils.random(300, 600),
                                angle: gsap.utils.random(0, 360),
                                gravity: gsap.utils.random(800, 1200)
                            },
                            rotation: gsap.utils.random(0, 720),
                            autoAlpha: 0,
                            ease: "power1.out"
                        }, "<");
                }
            });
        }
    }

    function startContinuousConfettiPoppers() {
        const confettiContainer = document.querySelector('.confetti-container');
        const continuousColors = [primaryColor, secondaryColor, '#ff7597', primaryVariantColor, '#018786'];

        function createConfettiParticle() {
            const dot = document.createElement("div");
            dot.classList.add("dot", "continuous-popper-confetti");
            confettiContainer.appendChild(dot);

            const popperStartX = gsap.utils.random(0, window.innerWidth);
            const popperStartY = -20;

            const width = gsap.utils.random(0.6, 1.2, 0.1) + 'vw';
            const height = gsap.utils.random(0.3, 0.8, 0.1) + 'vw';
            const wavyBorderRadius = gsap.utils.random([
                '50% 10% 50% 10% / 10% 50% 10% 50%',
                '60% 40% 60% 40% / 30% 70% 30% 70%',
                '70% 30% 70% 30% / 50% 50% 50% 50%', 
                '80% 20% 80% 20% / 20% 80% 20% 80%',
                '75% 25%',
                '50% 0% 50% 0%',
                '0% 50% 0% 50%'
            ]);


            const initialVelocity = gsap.utils.random(150, 250);
            const initialAngle = gsap.utils.random(225, 315);
            const particleGravity = gsap.utils.random(400, 600);
            const fadeDuration = gsap.utils.random(0.5, 1.5);

            gsap.set(dot, {
                backgroundColor: gsap.utils.random(continuousColors),
                width: width,
                height: height,
                borderRadius: wavyBorderRadius,
                x: popperStartX,
                y: popperStartY,
                rotation: gsap.utils.random(0, 360),
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

function initDraggableElements() {
    const cakeImage = document.querySelector('.cake-image');
    const farsuImage = document.querySelector('.farsu-image');
    const glossyBackground = document.querySelector('#draggable-cake-section');

    if (!cakeImage || !glossyBackground || !farsuImage) {
        console.warn("One or more draggable elements or their container not found. Draggable functionality will not be initialized.");
        return;
    }

    gsap.set(cakeImage, { transformOrigin: "center center" });
    gsap.set(farsuImage, { transformOrigin: "center center" });

    let cakeMovementTween;
    let farsuMovementTween;
    let cakeDraggableInstance;
    let farsuDraggableInstance;

    function setupInteractions() {
        cakeDraggableInstance = Draggable.create(cakeImage, {
            type: "x,y",
            bounds: glossyBackground,
            inertia: {
                bounce: 0.5
            },
            edgeResistance: 0.7,
            onPress: function() {
                if (cakeMovementTween) cakeMovementTween.kill();
                if (farsuMovementTween) farsuMovementTween.kill();
                gsap.to(this.target, { scale: 1.1, duration: 0.1, ease: "power2.out" });
                gsap.to(farsuImage, {
                    x: this.x + gsap.utils.random(-10, 10),
                    y: this.y + gsap.utils.random(-10, 10),
                    duration: 0.1,
                    overwrite: true
                });
            },
            onDrag: function() {
                gsap.to(farsuImage, {
                    x: this.x + gsap.utils.random(-10, 10),
                    y: this.y + gsap.utils.random(-10, 10),
                    duration: 0.1,
                    overwrite: true
                });
            },
            onRelease: function() {
                gsap.to(this.target, { scale: 1, duration: 0.2, ease: "power2.out" });
                startRandomMovement(this.target, this, 'cake');
            },
            onDragEnd: function() {
                startRandomMovement(this.target, this, 'cake');
            },
            onThrowUpdate: function() {
                gsap.set(farsuImage, {
                    x: this.x + gsap.utils.random(-10, 10),
                    y: this.y + gsap.utils.random(-10, 10)
                });
            }
        })[0];

        farsuDraggableInstance = Draggable.create(farsuImage, {
            type: "x,y",
            bounds: glossyBackground,
            inertia: {
                bounce: 0.8
            },
            edgeResistance: 0.8,
            onPress: function() {
                if (farsuMovementTween) farsuMovementTween.kill();
                gsap.to(this.target, { scale: 1.2, duration: 0.1, ease: "power2.out" });
            },
            onRelease: function() {
                gsap.to(this.target, { scale: 1, duration: 0.2, ease: "power2.out" });
                if (cakeMovementTween && cakeMovementTween.isActive()) {
                    startFollowingCake(this.target, this, cakeDraggableInstance);
                } else {
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

        setTimeout(() => {
            const containerRect = glossyBackground.getBoundingClientRect();
            const cakeRect = cakeImage.getBoundingClientRect();
            
            const centerX = (containerRect.width - cakeRect.width) / 2;
            const centerY = (containerRect.height - cakeRect.height) / 2;
            
            gsap.set(cakeImage, { x: centerX, y: centerY });
            gsap.set(farsuImage, { 
                x: centerX + gsap.utils.random(-30, 30),
                y: centerY + gsap.utils.random(-30, 30)
            });

            cakeDraggableInstance.update();
            farsuDraggableInstance.update();

            startRandomMovement(cakeImage, cakeDraggableInstance, 'cake');
            startFollowingCake(farsuImage, farsuDraggableInstance, cakeDraggableInstance);
        }, 100);
    }

    function startRandomMovement(target, draggable, type) {
        const buffer = 20;
        const currentTween = type === 'cake' ? cakeMovementTween : farsuMovementTween;
        if (currentTween) currentTween.kill();

        const targetX = gsap.utils.random(
            draggable.minX + buffer,
            draggable.maxX - buffer
        );
        const targetY = gsap.utils.random(
            draggable.minY + buffer,
            draggable.maxY - buffer
        );

        const velocity = gsap.utils.random(200, 400);
        const angle = Math.atan2(targetY - draggable.y, targetX - draggable.x) * 180 / Math.PI;

        const newTween = gsap.to(target, {
            duration: gsap.utils.random(1.5, 3),
            physics2D: {
                velocity: velocity,
                angle: angle,
                gravity: 0,
                friction: 0.1,
                bounce: draggable.vars.inertia.bounce
            },
            ease: "none",
            onComplete: () => startRandomMovement(target, draggable, type)
        });

        if (type === 'cake') {
            cakeMovementTween = newTween;
        } else {
            farsuMovementTween = newTween;
        }
    }

    function startFollowingCake(farsuTarget, farsuDraggable, cakeDraggable) {
        if (farsuMovementTween) farsuMovementTween.kill();

        farsuMovementTween = gsap.to(farsuTarget, {
            duration: 0.8,
            ease: "power2.out",
            repeat: -1,
            onUpdate: function() {
                const cakeX = cakeDraggable.x;
                const cakeY = cakeDraggable.y;
                const offsetX = gsap.utils.random(-10, 10);
                const offsetY = gsap.utils.random(-10, 10);

                const farsuTargetX = gsap.utils.clamp(
                    farsuDraggable.minX,
                    farsuDraggable.maxX,
                    cakeX + offsetX
                );
                const farsuTargetY = gsap.utils.clamp(
                    farsuDraggable.minY,
                    farsuDraggable.maxY,
                    cakeY + offsetY
                );

                gsap.to(farsuTarget, {
                    x: farsuTargetX,
                    y: farsuTargetY,
                    duration: 0.3,
                    physics2D: {
                        velocity: 100,
                        angle: Math.atan2(farsuTargetY - farsuDraggable.y, farsuTargetX - farsuDraggable.x) * 180 / Math.PI,
                        gravity: 0,
                        friction: 0.1,
                        bounce: farsuDraggable.vars.inertia.bounce * 0.5
                    },
                    ease: "none"
                });
            }
        });

        cakeDraggable.addEventListener("drag", () => {
            gsap.to(farsuTarget, {
                x: cakeDraggable.x + gsap.utils.random(-10, 10),
                y: cakeDraggable.y + gsap.utils.random(-10, 10),
                duration: 0.1
            });
            if (farsuMovementTween && !farsuMovementTween.isActive()) {
                farsuMovementTween.restart(true);
            }
        });

        cakeDraggable.addEventListener("throwUpdate", () => {
            gsap.to(farsuTarget, {
                x: cakeDraggable.x + gsap.utils.random(-10, 10),
                y: cakeDraggable.y + gsap.utils.random(-10, 10),
                duration: 0.1
            });
            if (farsuMovementTween && !farsuMovementTween.isActive()) {
                farsuMovementTween.restart(true);
            }
        });

        cakeDraggable.addEventListener("dragend", () => {
            if (!cakeDraggable.isDragging) {
                if (farsuMovementTween) {
                    farsuMovementTween.restart(true);
                } else {
                    startRandomMovement(farsuTarget, farsuDraggable, 'farsu');
                }
            }
        });

        if (cakeMovementTween) {
            cakeMovementTween.eventCallback("onComplete", () => {
                if (!cakeDraggable.isDragging && !farsuDraggable.isDragging) {
                    startRandomMovement(farsuTarget, farsuDraggable, 'farsu');
                }
            });
        }
    }

    setTimeout(setupInteractions, 100);
}

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

            if (heading) {
                tl.to(
                    heading,
                    { "--width": 800, xPercent: 30 * direction },
                    0
                );
            }

            if (nextHeading) {
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

        if (interactiveSection) {
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

    function initMouseWaveGallery() {
        let oldX = 0,
            oldY = 0,
            deltaX = 0,
            deltaY = 0

        const root = document.querySelector('.mwg_effect000')

        if (root) {
            root.addEventListener("mousemove", (e) => {
                deltaX = e.clientX - oldX;

                deltaY = e.clientY - oldY;

                oldX = e.clientX;
                oldY = e.clientY;
            })

            root.querySelectorAll('.media').forEach(el => {

                el.addEventListener('mouseenter', () => {
                    const tl = gsap.timeline({
                        onComplete: () => {
                            tl.kill()
                        }
                    })
                    tl.timeScale(1.2)

                    const image = el.querySelector('img')
                    if (image) { 
                        tl.to(image, {
                            inertia: {
                                x: {
                                    velocity: deltaX * 30,
                                    end: 0 
                                },
                                y: {
                                    velocity: deltaY * 30,
                                    end: 0 
                                },
                            },
                        })
                        tl.fromTo(image, {
                            rotate: 0
                        }, {
                            duration: 0.4,
                            rotate: (Math.random() - 0.5) * 30,
                            yoyo: true,
                            repeat: 1,
                            ease: 'power1.inOut'
                        }, '<')
                    }
                })
            })
        } else {
            console.warn("Element with class 'mwg_effect000' not found. Mouse wave gallery effect will not be initialized.");
        }
    }

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
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = gsap.utils.random(60, 100);
        const startX = gsap.utils.random(0, window.innerWidth);
        const startY = window.innerHeight + size;
        const floatDuration = gsap.utils.random(15, 25);
        const swayAmount = gsap.utils.random(50, 150);
        
        balloon.style.backgroundColor = color;
        balloon.style.width = `${size}px`;
        balloon.style.height = `${size * 1.25}px`;
        
        gsap.set(balloon, {
            x: startX,
            y: startY
        });
        
        const floatTween = gsap.to(balloon, {
            y: -size * 2,
            duration: floatDuration,
            ease: "none",
            onComplete: () => {
                balloon.remove();
                balloons = balloons.filter(b => b.element !== balloon);
            }
        });
        
        const swayTween = gsap.to(balloon, {
            x: `+=${swayAmount}`,
            duration: gsap.utils.random(3, 6),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
        
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
        
        const balloonObj = balloons.find(b => b.element === balloon);
        if (balloonObj) {
            balloonObj.floatTween.kill();
            balloonObj.swayTween.kill();
            balloons = balloons.filter(b => b !== balloonObj);
        }
        balloon.remove();
    }

    for (let i = 0; i < balloonCount; i++) {
        createBalloon();
    }

    balloonInterval = setInterval(() => {
        if (balloons.length < balloonCount * 1.5) {
            createBalloon();
        }
    }, 2000);

    window.addEventListener('resize', () => {
        balloons.forEach(balloon => {
            balloon.floatTween.kill();
            balloon.swayTween.kill();
            balloon.element.remove();
        });
        balloons = [];
        clearInterval(balloonInterval);
        
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

    setupAudioInteraction();
    initSlideshow();
    startContinuousConfettiPoppers();
    initDraggableElements();
    initMouseWaveGallery();
    initBalloons();

});
