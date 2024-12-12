// In a real app, this data would live in a database,
// rather than in memory. But for now, we cheat.
const db = new Map();

export function getTodos(userid: any) {
    if (!db.get(userid)) {
        db.set(userid, [{
            id: crypto.randomUUID(),
            description: 'Learn SvelteKit',
            done: false
        }]);
    }

    return db.get(userid);
}

export function createTodo(userid: any, description: any) {
    if (description === '') {
        throw new Error('todo must have a description');
    }

    const todos = db.get(userid);

    if (todos.find((todo: any) => todo.description === description)) {
        throw new Error('todos must be unique');
    }

    todos.push({
        id: crypto.randomUUID(),
        description,
        done: false
    });
}

export function deleteTodo(userid: any, todoid: any) {
    const todos = db.get(userid);
    const index = todos.findIndex((todo: any) => todo.id === todoid);

    if (index !== -1) {
        todos.splice(index, 1);
    }
}
