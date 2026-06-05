You can make it more fun by using themes:

const themes = {
dev: ["deploy", "bug", "cache", "backend", "frontend", "merge conflict"],
existential: ["moon", "silence", "void", "memory", "dream", "dust"],
desi: ["chai", "auto", "biryani", "hostel", "monsoon", "signal"]
};

Then generate based on selected theme.

A better version would use sentence templates:

const templates = [
"The {noun} was too {adjective} to {verb}.",
"In the middle of {place}, a {noun} decided to {verb}.",
"{noun} energy is just {adjective} {noun} behavior."
];

const data = {
noun: ["backend", "moon", "chai", "intern", "bug"],
adjective: ["cosmic", "unhinged", "sleepy", "dramatic"],
verb: ["deploy", "vibe", "disappear", "compile"],
place: ["Bangalore traffic", "a forgotten repo", "the hostel corridor"]
};

function fillTemplate(template) {
return template.replace(/\{(\w+)\}/g, (\_, key) => {
const options = data[key];
return options[Math.floor(Math.random() * options.length)];
});
}

console.log(fillTemplate(templates[0]));

Output:

The chai was too unhinged to compile.

This could become a cute web app too:

[Theme dropdown]
[Number of paragraphs]
[Generate]
[Copy text]

Honestly, “lorem ipsum but it sounds like your brain at 2 AM” would be a very fun mini project.
