// 页面加载初始化
window.onload = async () => {
    setSyncStatus("Loading Cloud Data...");
    const { data: notes, error } = await _supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        setSyncStatus("Sync Error");
        return;
    }

    allNotes = notes || [];
    if (allNotes.length > 0) {
        renderAll(allNotes);
    } else {
        addNewUnit(); 
    }
    setSyncStatus("Cloud Synced");
};

// 渲染所有笔记
function renderAll(notesArray) {
    const container = document.getElementById('note-container');
    container.innerHTML = ''; 
    notesArray.forEach(note => renderUnitUI(note));
}

// 新增笔记单元
async function addNewUnit() {
    setSyncStatus("Saving...");
    const { data, error } = await _supabase
        .from('notes')
        .insert([{ excerpt: '', reflection: '', source_chapter: '', tags: [] }])
        .select();

    if (!error && data) {
        allNotes.push(data[0]);
        renderUnitUI(data[0]);
        setSyncStatus("Cloud Synced");
    }
}

// 核心 UI 构造函数
function renderUnitUI(noteData) {
    const container = document.getElementById('note-container');
    const section = document.createElement('section');
    section.className = 'note-unit group';
    section.innerHTML = `
        <button class="delete-unit-btn" onclick="deleteNote(this, '${noteData.id}')">×</button>
        <div>
            <div class="decoration-line"></div>
            <span class="label-real">Excerpt / 原文摘录</span>
            <div contenteditable="true" class="excerpt-input serif" 
                 data-placeholder="在此记录文学或逻辑的片段..."
                 onblur="saveField('${noteData.id}', 'excerpt', this.innerText)">${noteData.excerpt || ''}</div>
        </div>
        <div class="flex flex-col gap-10">
            <div class="bg-white/50 dark:bg-black/10 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                <span class="label-real">Notes / 我的感悟</span>
                <textarea class="ghost-input min-h-[120px] leading-relaxed" 
                          placeholder="写下你的思考..."
                          onblur="saveField('${noteData.id}', 'reflection', this.value)">${noteData.reflection || ''}</textarea>
            </div>
            <div>
                <span class="label-real">Source / 章节出处</span>
                <input type="text" class="ghost-input" placeholder="例如：Chapter 01"
                       value="${noteData.source_chapter || ''}"
                       onblur="saveField('${noteData.id}', 'source_chapter', this.value)">
            </div>
            <div>
                <span class="label-real">Tags / 标签索引</span>
                <div class="flex flex-wrap gap-2">
                    ${(noteData.tags || []).map(t => `
                        <div class="tag-pill">${t} <span class="cursor-pointer opacity-30 hover:text-pink-500 ml-1" onclick="removeTag(this, '${noteData.id}', '${t}')">×</span></div>
                    `).join('')}
                    <button onclick="addTag(this, '${noteData.id}')" class="tag-pill border-dashed opacity-40 hover:opacity-100">+ New Tag</button>
                </div>
            </div>
        </div>
    `;
    container.appendChild(section);
}