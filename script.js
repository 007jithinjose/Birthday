document.addEventListener('DOMContentLoaded', function() {
    // Get CSS variables for confetti colors
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--primary').trim();
    const primaryVariantColor = rootStyles.getPropertyValue('--primary-variant').trim();
    const secondaryColor = rootStyles.getPropertyValue('--secondary').trim();

    // Register GSAP plugins (Observer is needed for scroll/touch control)
    gsap.registerPlugin(Observer);

    // Music toggle functionality
    const audio = document.getElementById('birthdayAudio');
    const musicToggle = document.querySelector('.music-toggle');
    let isPlaying = false;
    let audioInitiatedOnce = false; // Tracks if audio playback (muted or unmuted) has been attempted

    // Function to attempt playing audio unmuted
    function enableAudio() {
        audio.muted = false;
        audio.play()
            .then(() => {
                isPlaying = true;
                audioInitiatedOnce = true; // Mark as successfully initiated
                musicToggle.innerHTML = '🔊'; // Show speaker icon
                console.log("Audio playing (unmuted)");
                // After successful unmuted playback, remove the global listeners
                removeInitialInteractionListeners();
            })
            .catch(error => {
                console.log("Unmuted playback failed after interaction:", error);
                // If it still fails, keep the mute icon as playback isn't active
                musicToggle.innerHTML = '🔇';
                isPlaying = false;
                audio.muted = true; // Revert to muted if unmuted play fails
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
        if (!audioInitiatedOnce) { // Only attempt to unmute if not already done
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
                isPlaying = true; // Audio is playing, but muted
                audioInitiatedOnce = true; // Mark as initiated (even if muted)
                musicToggle.innerHTML = '🔇'; // Show muted icon initially

                // If muted autoplay works, wait for *any* first user interaction to unmute.
                document.body.addEventListener('click', handleFirstInteraction, { once: true });

                Observer.create({
                    id: "audioUnmuteObserver", // Give it an ID to kill it later
                    type: "wheel,touch,pointer",
                    onUp: handleFirstInteraction,
                    onDown: handleFirstInteraction,
                    tolerance: 10,
                    once: true // Only trigger once
                });

            })
            .catch(mutedError => {
                console.log("Muted autoplay failed:", mutedError);
                // If muted autoplay also fails (e.g., stricter mobile policies),
                // show muted icon and wait for the first *any* user interaction to play unmuted.
                musicToggle.innerHTML = '🔇';
                isPlaying = false; // No audio playing yet
                audioInitiatedOnce = false; // Not initiated yet

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

        // 2. Music toggle button behavior
        musicToggle.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling that might trigger global interaction listeners prematurely
            if (isPlaying) {
                audio.pause();
                isPlaying = false;
                musicToggle.innerHTML = '🔇';
                console.log("Audio paused");
            } else {
                // If audio wasn't playing, try to play it (unmuted by default via enableAudio)
                audio.muted = false; // Ensure it's unmuted before trying to play
                enableAudio(); // This will attempt to play and update isPlaying/icon
            }
        });
    }

    setupAudioInteraction(); // Initialize audio interaction logic
    initSlideshow(); // Initialize the slideshow

    // Confetti function
    function createConfetti() {
        const colors = [primaryColor, secondaryColor, '#ff7597', primaryVariantColor, '#018786'];
        const confettiContainer = document.querySelector('.confetti-container');

        for (let i = 0; i < 300; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';

            // Initial horizontal position
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = Math.random() * 12 + 3 + 'px';
            confetti.style.height = Math.random() * 12 + 3 + 'px';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';

            confettiContainer.appendChild(confetti);

            // Use gsap.fromTo() to explicitly define start and end states
            gsap.fromTo(confetti,
                { // FROM state (initial appearance)
                    y: -50, // Start slightly above the viewport
                    opacity: 1, // Start fully visible
                    rotation: gsap.utils.random(0, 360) // Initial rotation
                },
                { // TO state (falling and fading out)
                    y: window.innerHeight + 100, // End well below the viewport
                    x: `+=${gsap.utils.random(-150, 150)}`, // Horizontal drift
                    rotation: gsap.utils.random(360, 720), // Continue rotation
                    duration: gsap.utils.random(2, 4),
                    opacity: 0, // End fully invisible
                    ease: "power1.out",
                    delay: gsap.utils.random(0, 1), // Stagger the start of each confetti
                    onComplete: () => confetti.remove()
                }
            );
        }
    }

    // Initial confetti burst and repeat every 5 seconds
    createConfetti();
    setInterval(createConfetti, 5000);
});

// Slideshow Initialization Function
function initSlideshow() {
    const sections = gsap.utils.toArray(".slide");
    const images = gsap.utils.toArray(".image").reverse(); // Overlay images
    const slideImages = gsap.utils.toArray(".slide__img"); // Images within each slide
    const outerWrappers = gsap.utils.toArray(".slide__outer");
    const innerWrappers = gsap.utils.toArray(".slide__inner");
    const count = document.querySelector(".count");
    const interactiveSection = document.querySelector(".interactive-section-wrapper"); // Get the interactive section wrapper
    // Removed the "JITHIN" slide, so total sections are 3 instead of 4
    const wrap = gsap.utils.wrap(0, sections.length);
    let currentIndex = 0;
    let slideInterval;
    let animating = false; // Flag to prevent rapid navigation

    // Set initial states for all slides
    gsap.set(outerWrappers, { xPercent: 100 });
    gsap.set(innerWrappers, { xPercent: -100 });

    gsap.set(".slide:nth-of-type(1) .slide__outer", { xPercent: 0 });
    gsap.set(".slide:nth-of-type(1) .slide__inner", { xPercent: 0 });
    gsap.set(".slide:nth-of-type(1) .slide__heading", { "--width": 200, xPercent: 0 });


    function gotoSection(index, direction) {
        if (animating) return; // Prevent new animation if one is already in progress
        animating = true;

        index = wrap(index); // Ensure index wraps around (e.g., from last to first)

        let tl = gsap.timeline({
            defaults: { duration: 0.8, ease: "expo.inOut" },
            onComplete: () => {
                animating = false; // Reset flag when animation completes
            }
        });

        let currentSection = sections[currentIndex];
        let heading = currentSection.querySelector(".slide__heading");
        let nextSection = sections[index];
        let nextHeading = nextSection.querySelector(".slide__heading");

        // Set zIndex and autoAlpha for current and next slides/images
        gsap.set([sections, images], { zIndex: 0, autoAlpha: 0 }); // Hide all
        gsap.set([sections[currentIndex], images[index]], { zIndex: 1, autoAlpha: 1 }); // Current elements and next overlay image
        gsap.set([sections[index], images[currentIndex]], { zIndex: 2, autoAlpha: 1 }); // Next slide elements and current overlay image (to animate out)

        // Animation timeline
        tl
            .to(count, {
                innerText: index + 1, // Update slide number
                duration: 0.4,
                snap: { innerText: 1 },
                ease: "power2.out"
            }, 0.25)
            .fromTo(
                outerWrappers[index],
                { xPercent: 100 * direction }, // Start off-screen
                { xPercent: 0 }, // Move to center
                0
            )
            .fromTo(
                innerWrappers[index],
                { xPercent: -100 * direction }, // Start off-screen (opposite direction)
                { xPercent: 0 }, // Move to center
                0
            )
            .to(
                heading,
                { "--width": 800, xPercent: 30 * direction }, // Animate current heading out
                0
            )
            .fromTo(
                nextHeading,
                { "--width": 800, xPercent: -30 * direction }, // Animate next heading in
                { "--width": 200, xPercent: 0 }, // Final state for next heading
                0
            )
            .fromTo(
                images[index], // Overlay image for the next slide
                { xPercent: 125 * direction, scaleX: 1.5, scaleY: 1.3 },
                { xPercent: 0, scaleX: 1, scaleY: 1 },
                0
            )
            .fromTo(
                images[currentIndex], // Overlay image for the current slide
                { xPercent: 0, scaleX: 1, scaleY: 1 },
                { xPercent: -125 * direction, scaleX: 1.5, scaleY: 1.3 },
                0
            )
            .fromTo(
                slideImages[index], // Image within the next slide content
                { scale: 2 },
                { scale: 1 },
                0
            );

        currentIndex = index; // Update current index
        resetSlideInterval(); // Reset auto-advance timer after manual interaction
    }

    // Auto-advance slides every 3 seconds
    function startSlideInterval() {
        slideInterval = setInterval(() => gotoSection(currentIndex + 1, +1), 3000);
    }

    function resetSlideInterval() {
        clearInterval(slideInterval);
        startSlideInterval();
    }

    // Start the slideshow initially
    startSlideInterval();

    // Observer for scroll/touch/pointer events, targeting only the interactive section
    Observer.create({
        target: interactiveSection, // THIS IS THE KEY CHANGE!
        type: "wheel,touch,pointer",
        preventDefault: true, // Prevent default scroll behavior *only within this target*
        wheelSpeed: -1, // Normalize wheel direction (adjust if it feels inverted)
        onUp: () => { // Scroll/swipe up -> go to next slide
            if (animating) return;
            gotoSection(currentIndex + 1, +1);
        },
        onDown: () => { // Scroll/swipe down -> go to previous slide
            if (animating) return;
            gotoSection(currentIndex - 1, -1);
        },
        tolerance: 10 // Sensitivity for swipe/scroll gestures
    });

    // Keyboard navigation (still global, as desired)
    document.addEventListener("keydown", function(e) {
        if (animating) return; // Prevent new animation if one is already in progress

        if ((e.code === "ArrowUp" || e.code === "ArrowLeft")) {
            gotoSection(currentIndex - 1, -1);
        }
        if ((e.code === "ArrowDown" || e.code === "ArrowRight" || e.code === "Space" || e.code === "Enter")) {
            gotoSection(currentIndex + 1, 1);
        }
    });
}