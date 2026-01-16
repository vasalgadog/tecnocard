document.addEventListener("DOMContentLoaded", function() {
      // Usamos setTimeout para asegurar que el DOM esté pintado y las dimensiones sean correctas
      setTimeout(() => {
        const target = document.getElementById('target-step');
        if (target) {
          // block: "center" asegura que el elemento quede en medio del área de scroll
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    });