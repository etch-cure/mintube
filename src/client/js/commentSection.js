const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
const comments = document.getElementById("comments")
const deleteCommentButtons = comments.querySelectorAll("button");

const addComment = (text, id) => {
  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  newComment.dataset.id = id;
  newComment.className = "video__comment";
  const icon = document.createElement("i");
  icon.className = "fas fa-comment";
  const span = document.createElement("span");
  span.innerText = ` ${text}`;
  span.className = "comment-text"
  const button = document.createElement("button");
  button.innerText = "❌";
  button.className = "del-comment"
  button.addEventListener("click", handleDelete)
  newComment.appendChild(icon);
  newComment.appendChild(span);
  newComment.appendChild(button);
  videoComments.prepend(newComment);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const textarea = form.querySelector("textarea");
  const text = textarea.value;
  const videoId = videoContainer.dataset.id;
  if (text === "") {
    return;
  }
  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (response.status === 201) {
    textarea.value = "";
    const { newCommentId } = await response.json();
    addComment(text, newCommentId);
  }
};

const handleDelete = async (event) => {
  event.preventDefault()
  const commentNode = event.target?.parentNode
  const commentId = commentNode?.dataset.id
  if (commentId) {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      }
    })
  
    if (response.status === 403) {
      window.location.reload()
    }
  
    if (response.status === 200) {
      commentNode.remove()
    }
    console.log(response)
  }
}

deleteCommentButtons.forEach((deleteButton) => {
  deleteButton.addEventListener("click", handleDelete)
})

if (form) {
  form.addEventListener("submit", handleSubmit);
}