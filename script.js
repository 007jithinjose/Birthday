document.addEventListener('DOMContentLoaded', function() {
    // Get CSS variables for confetti colors
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--primary').trim();
    const primaryVariantColor = rootStyles.getPropertyValue('--primary-variant').trim();
    const secondaryColor = rootStyles.getPropertyValue('--secondary').trim();

    // Register GSAP plugins (Observer, MorphSVGPlugin, Physics2DPlugin are needed)
    gsap.registerPlugin(Observer, MorphSVGPlugin, Physics2DPlugin);

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

                // --- Confetti Burst on Click ---
                // Get the button's position and dimensions
                const buttonRect = musicToggle.getBoundingClientRect();
                // Calculate the center of the button relative to the viewport
                const startX = buttonRect.left + buttonRect.width / 2;
                const startY = buttonRect.top + buttonRect.height / 2;

                const dotCount = gsap.utils.random(15, 30, 1);
                const colors = [primaryColor, secondaryColor, '#ff7597', primaryVariantColor, '#018786'];

                for (let i = 0; i < dotCount; i++) {
                    const dot = document.createElement("div");
                    dot.classList.add("dot");
                    // Append to confetti-container for better organization
                    document.querySelector('.confetti-container').appendChild(dot); 

                    gsap.set(dot, {
                        backgroundColor: gsap.utils.random(colors),
                        // Position relative to the confetti-container (which is fixed)
                        top: startY, 
                        left: startX, 
                        scale: 0
                    });

                    gsap.timeline({ onComplete: () => dot.remove() })
                        .to(dot, {
                            scale: gsap.utils.random(0.3, 1),
                            duration: 0.3,
                            ease: "power3.out"
                        })
                        .to(dot, {
                            duration: 2,
                            physics2D: {
                                velocity: gsap.utils.random(200, 400), 
                                angle: gsap.utils.random(0, 360),
                                gravity: 800 
                            },
                            autoAlpha: 0,
                            ease: "none"
                        }, "<");
                }
                // --- End Confetti Burst ---
            });
        }
    }

    setupAudioInteraction();
    initSlideshow();
});

// Slideshow Initialization Function (Unchanged from previous versions)
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