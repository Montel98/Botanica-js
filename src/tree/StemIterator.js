export function* stemIterator(root) {
    //const root = tree.root;

    let stems = [...root];

    while (stems.length > 0) {

        let currentStem = stems.pop();
        let currentStackFrame = currentStem.stackFrame;

        for (let i = 0; i < currentStackFrame.nextStems.length; i++) {

            stems.push(currentStackFrame.nextStems[i]);
        }

        yield currentStem;
    }

    return 0;
}