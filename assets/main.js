const baseURL = "https://innovation-showcase-backend.onrender.com/api";

// Get query params from URL
function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

document.addEventListener("DOMContentLoaded", () => {
 
  // REGISTER
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const role = document.getElementById("role").value;

      try {
        const res = await fetch(`${baseURL}/register`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          mode: 'cors',
          credentials: 'include',
          body: JSON.stringify({ username, email, password, role })
        });

        const data = await res.json();
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user_id", data.user.id);
          localStorage.setItem("role", data.user.role);
          alert("Registration successful");
          window.location.href = "login.html";
        } else {
          alert(data.message || "Registration failed");
        }
      } catch (err) {
        console.error("Registration error:", err);
        alert("Registration failed");
      }
    });
  }

  // ================================
  // LOGIN
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      if (!email || !password) {
        alert("Please fill in all fields");
        return;
      }

      try {
        const res = await fetch(`${baseURL}/login`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          credentials: 'include',
          body: JSON.stringify({ 
            email,
            password
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Login failed');
        }

        const data = await res.json();

        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user_id", data.user.id);
          localStorage.setItem("role", data.user.role);

          alert("Login successful");

          if (data.user.role === "admin") {
            window.location.href = "admin.html";
          } else {
            window.location.href = "dashboard.html";
          }
        } else {
          throw new Error(data.message || "Login failed");
        }
      } catch (err) {
        console.error("Login error:", err);
        alert(err.message || "Login failed. Please check your credentials.");
      }
    });
  }

  // ================================
  // PROJECT LISTING (index.html)
  const projectContainer = document.getElementById("projects");
  if (projectContainer) {
    fetch(`${baseURL}/projects`)
      .then(res => res.json())
      .then(projects => {
        console.log("Loaded projects:", projects);
        projectContainer.innerHTML = projects.map(project => `
          <div class="card">
            <h3>${project.title}</h3>
            <p><strong>Category:</strong> ${project.category || "N/A"}</p>
            <p>${project.description.slice(0, 100)}...</p>
            <a href="project.html?id=${project.id}">View Project</a>
          </div>
        `).join("");
      })
      .catch(() => {
        projectContainer.innerHTML = `<p>Unable to load projects.</p>`;
      });
  }

  // ================================
  // PROJECT DETAILS + COMMENTS (project.html)
  const projectId = getQueryParam("id");
  const projectDetails = document.getElementById("projectContainer");
  const commentList = document.getElementById("commentList");

  if (projectDetails && projectId) {
    fetch(`${baseURL}/projects/${projectId}`)
      .then(res => res.json())
      .then(project => {
        const html = `
          <h2>${project.title}</h2>
          <p><strong>Category:</strong> ${project.category}</p>
          <p>${project.description}</p>
          ${project.video_link ? `<p><a href="${project.video_link}" target="_blank">Watch Video</a></p>` : ""}
        `;
        projectDetails.innerHTML = html;
      });
  }

  if (commentList && projectId) {
    fetch(`${baseURL}/comments/${projectId}`)
      .then(res => res.json())
      .then(comments => {
        commentList.innerHTML = comments.length
          ? comments.map(c => `
              <div class="card">
                <p><strong>${c.name}</strong> says:</p>
                <p>${c.comment}</p>
              </div>
            `).join("")
          : "<p>No comments yet.</p>";
      });
  }

  const commentForm = document.getElementById("commentForm");
  if (commentForm && projectId) {
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      const comment = document.getElementById("commentText").value;

      if (!token) {
        alert("Please log in to comment");
        window.location.href = "login.html";
        return;
      }

      try {
        const res = await fetch(`${baseURL}/comments`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ project_id: projectId, comment })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to post comment");
        }

        const data = await res.json();
        alert(data.message || "Comment posted");
        window.location.reload();
      } catch (err) {
        alert(err.message || "Failed to post comment");
      }
    });
  }

  // ================================
  // PROJECT SUBMISSION (dashboard.html)
  const projectForm = document.getElementById("projectForm");
  if (projectForm) {
    projectForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const user_id = localStorage.getItem("user_id");
      if (!user_id) return alert("Please log in to submit a project.");

      const title = document.getElementById("title").value;
      const description = document.getElementById("description").value;
      const category = document.getElementById("category").value;
      const tags = document.getElementById("tags").value;
      const video_link = document.getElementById("video_link").value;

      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${baseURL}/projects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            user_id, 
            title, 
            description, 
            category, 
            tags, 
            video_link 
          })
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to submit project");
        }

        const data = await res.json();
        alert("Project submitted successfully!");
        projectForm.reset();
      } catch (err) {
        console.error("Project submission error:", err);
        alert(err.message || "Failed to submit project");
      }
    });
  }

  // ADMIN PANEL (admin.html)
  const pendingProjectsContainer = document.getElementById("pendingProjects");
  if (pendingProjectsContainer) {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      alert("Access denied: Admins only");
      window.location.href = "login.html";
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first");
      window.location.href = "login.html";
      return;
    }

    fetch(`${baseURL}/admin/pending`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(projects => {
        if (!projects.length) {
          pendingProjectsContainer.innerHTML = "<p>No pending projects.</p>";
          return;
        }

        pendingProjectsContainer.innerHTML = projects.map(project => `
          <div class="card">
            <h3>${project.title}</h3>
            <p><strong>Submitted by:</strong> User #${project.user_id}</p>
            <p>${project.description.slice(0, 100)}...</p>
            <div style="display:flex; gap:1rem; margin-top: 1rem;">
              <button onclick="handleApprove('${project.id}')">Approve</button>
              <button onclick="handleReject('${project.id}')" style="background:red;">Reject</button>
            </div>
          </div>
        `).join("");
      })
      .catch(() => {
        pendingProjectsContainer.innerHTML = "<p>Failed to load projects.</p>";
      });
  }
});

// Global approve/reject handlers
window.handleApprove = async function(id) {
  const confirm = window.confirm("Approve this project?");
  if (!confirm) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${baseURL}/admin/approve/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await res.json();
    alert(data.message);
    window.location.reload();
  } catch (err) {
    alert("Failed to approve project");
  }
};

window.handleReject = async function(id) {
  const confirm = window.confirm("Reject this project?");
  if (!confirm) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${baseURL}/admin/reject/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await res.json();
    alert(data.message);
    window.location.reload();
  } catch (err) {
    alert("Failed to reject project");
  }
};

