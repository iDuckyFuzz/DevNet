const blocks = document.getElementsByClassName("block");

const comments = document.getElementsByClassName("comment");

for(const comment of comments){
    if(comment.className.split(" ")[1] != comment.parentElement.parentElement.id){
        comment.style.display = "none";
    }
}