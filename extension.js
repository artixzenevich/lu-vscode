const vscode = require("vscode");

const KEYWORDS = [
    { label: "запомнить", insertText: "запомнить ", detail: "Объявление и присваивание переменной" },
    { label: "печать", insertText: "печать(${1:выражение})", detail: "Вывод значения в терминал" },
    { label: "ввод", insertText: "ввод()", detail: "Чтение значения с клавиатуры" },
    { label: "выполнить", insertText: "выполнить ", detail: "Вызов процедуры" },
    { label: "вернуть", insertText: "вернуть ", detail: "Возврат значения из процедуры" },
    { label: "процедура", insertText: "процедура ", detail: "Определение процедуры" },
    { label: "если", insertText: "если ", detail: "Условный оператор" },
    { label: "то", insertText: " то", detail: "Начало ветки условия" },
    { label: "иначе", insertText: "иначе", detail: "Альтернативная ветка" },
    { label: "конец", insertText: "конец", detail: "Завершение блока" },
    { label: "для", insertText: "для ", detail: "Цикл со счётчиком" },
    { label: "от", insertText: " от ", detail: "Начало диапазона цикла" },
    { label: "до", insertText: " до ", detail: "Конец диапазона цикла" },
    { label: "пока", insertText: "пока ", detail: "Цикл с условием" },
    { label: "повтори", insertText: "повтори ", detail: "Цикл повторений" },
    { label: "раз", insertText: " раз", detail: "Завершение счётчика повторений" },
    { label: "и", insertText: "и", detail: "Логическое И" },
    { label: "или", insertText: "или", detail: "Логическое ИЛИ" },
    { label: "не", insertText: "не ", detail: "Логическое отрицание" },
];

const CONSTANTS = [
    { label: "истина", detail: "Логическое значение «истина»" },
    { label: "ложь", detail: "Логическое значение «ложь»" },
    { label: "ничего", detail: "Пустое значение" },
];

const BUILTINS = [
    { label: "длина", insertText: "длина(${1:выражение})", detail: "Длина массива, строки или объекта" },
    { label: "код", insertText: "код(${1:символ})", detail: "Unicode-код символа" },
    { label: "символ", insertText: "символ(${1:число})", detail: "Символ по Unicode-коду" },
    { label: "найти", insertText: "найти(${1:строка}, ${2:подстрока})", detail: "Поиск подстроки" },
    { label: "подстрока", insertText: "подстрока(${1:строка}, ${2:начало}, ${3:длина})", detail: "Вырезать подстроку" },
    { label: "добавить", insertText: "добавить(${1:массив}, ${2:значение})", detail: "Добавить элемент в массив" },
    { label: "удалить", insertText: "удалить(${1:массив}, ${2:индекс})", detail: "Удалить элемент из массива" },
    { label: "корень", insertText: "корень(${1:число})", detail: "Квадратный корень" },
    { label: "модуль", insertText: "модуль(${1:число})", detail: "Модуль (абсолютное значение)" },
    { label: "случ", insertText: "случ(${1:до})", detail: "Случайное число от 0 до N-1" },
    { label: "округлить", insertText: "округлить(${1:число})", detail: "Округление до целого" },
    { label: "вверх", insertText: "вверх(${1:строка})", detail: "Верхний регистр" },
    { label: "вниз", insertText: "вниз(${1:строка})", detail: "Нижний регистр" },
    { label: "заменить", insertText: "заменить(${1:строка}, ${2:что}, ${3:на_что})", detail: "Замена подстроки" },
    { label: "разделить", insertText: "разделить(${1:строка}, ${2:разделитель})", detail: "Разбить строку в массив" },
    { label: "соединить", insertText: "соединить(${1:массив}, ${2:разделитель})", detail: "Склеить массив в строку" },
    { label: "начинается", insertText: "начинается(${1:строка}, ${2:префикс})", detail: "Проверка префикса" },
    { label: "заканчивается", insertText: "заканчивается(${1:строка}, ${2:суффикс})", detail: "Проверка суффикса" },
    { label: "перевернуть", insertText: "перевернуть(${1:строка})", detail: "Разворот строки" },
];

function collectFileSymbols(document) {
    const text = document.getText();
    const symbols = { variables: new Set(), procedures: new Set() };

    const variableRegex = /запомнить\s+([\p{L}\p{N}_]+)/gu;
    let match;
    while ((match = variableRegex.exec(text)) !== null) {
        symbols.variables.add(match[1]);
    }

    const loopVarRegex = /для\s+([\p{L}\p{N}_]+)\s+от/gu;
    while ((match = loopVarRegex.exec(text)) !== null) {
        symbols.variables.add(match[1]);
    }

    const procedureRegex = /процедура\s+([\p{L}\p{N}_]+)\s*\(/gu;
    while ((match = procedureRegex.exec(text)) !== null) {
        symbols.procedures.add(match[1]);
    }

    const paramRegex = /процедура\s+[\p{L}\p{N}_]+\s*\(\s*([^)]*)/gu;
    while ((match = paramRegex.exec(text)) !== null) {
        for (const name of match[1].split(",")) {
            const trimmed = name.trim();
            if (trimmed) {
                symbols.variables.add(trimmed);
            }
        }
    }

    return symbols;
}

function activate(context) {
    const provider = vscode.languages.registerCompletionItemProvider(
        "lu",
        {
            provideCompletionItems(document, position) {
                const items = [];

                const keywordItem = (kw, kind, detail) => {
                    const item = new vscode.CompletionItem(kw.label, kind);
                    item.detail = detail;
                    if (kw.insertText) {
                        item.insertText = kw.insertText;
                    }
                    items.push(item);
                };

                KEYWORDS.forEach((kw) => keywordItem(kw, vscode.CompletionItemKind.Keyword, kw.detail));
                CONSTANTS.forEach((c) => keywordItem(c, vscode.CompletionItemKind.Constant, c.detail));

                BUILTINS.forEach((fn) => {
                    const item = new vscode.CompletionItem(fn.label, vscode.CompletionItemKind.Function);
                    item.detail = fn.detail;
                    item.insertText = new vscode.SnippetString(fn.insertText);
                    items.push(item);
                });

                const symbols = collectFileSymbols(document);
                symbols.procedures.forEach((name) => {
                    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
                    item.detail = "Процедура из файла";
                    items.push(item);
                });
                symbols.variables.forEach((name) => {
                    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
                    item.detail = "Переменная из файла";
                    items.push(item);
                });

                return items;
            },
        },
        ".", ":", "(", " "
    );

    context.subscriptions.push(provider);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};