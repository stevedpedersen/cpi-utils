import * as db from '$lib/server/database.js';

export function load({ cookies }) {

    const visited = cookies.get('visited');
    cookies.set('visited', 'true', { path: '/' });

    let id = cookies.get('userid');

    if (!id) {
        id = crypto.randomUUID();
        cookies.set('userid', id, { path: '/' });
    }

    return {
        visited: visited === 'true',
        todos: db.getTodos(id)
    }
}

export const actions = {
    create: async ({ cookies, request }) => {
        const data = await request.formData();
        db.createTodo(cookies.get('userid'), data.get('description'));
    },

    delete: async ({ cookies, request }) => {
        const data = await request.formData();
        db.deleteTodo(cookies.get('userid'), data.get('id'));
    }
};