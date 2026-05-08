// Create and animate the hearts in the background
const heartContainer = document.querySelector('.heart-container');

if (heartContainer) {
    // Create 100 heart elements and add them to the container
    for (let i = 1; i <= 100; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heartContainer.appendChild(heart);
    }

    // Function to animate the hearts using anime.js
    function animateHearts() {
        anime({
            targets: '.heart-container .heart', // Target hearts inside our specific container
            translateX: function() {
                // Random horizontal movement
                return anime.random(-700, 700);
            },
            translateY: function() {
                // Random vertical movement
                return anime.random(-500, 500);
            },
            rotate: 45, // Keep the heart shape rotated
            scale: function() {
                // Random size
                return anime.random(1, 5);
            },
            easing: 'easeInOutBack',
            duration: 3000,
            delay: anime.stagger(10),
            complete: animateHearts, // Loop the animation
        });
    }

    // Start the animation
    animateHearts();
}
