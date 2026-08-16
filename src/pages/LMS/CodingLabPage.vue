<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">
          {{ assignmentType === 'coding' ? 'INTERACTIVE LAB' : 'WRITTEN ASSIGNMENT' }}
        </p>
        <h1 class="text-display q-my-none">
          {{ assignmentType === 'coding' ? 'Coding Lab' : 'Assignment Submission' }}
        </h1>
        <div class="row items-center q-gutter-sm q-mt-xs">
          <p class="text-body q-my-none" style="color: var(--text-secondary);">
            {{ assignmentType === 'coding' ? 'Solve assignments and write code. Copy-paste is disabled.' : 'Complete your written assignment below. Progress is autosaved.' }}
          </p>
          <span class="text-caption text-weight-bold" :style="{ color: (saveStatus.includes('Offline') || saveStatus.includes('Error')) ? 'var(--color-warning)' : 'var(--color-success)' }">
            • {{ saveStatus }}
          </span>
        </div>
      </div>

      <!-- Submit Action for Assignment -->
      <div v-if="assignmentId" class="row items-center q-gutter-md">
        <span v-if="isTeacherMode" class="badge badge-red" style="font-size: 14px; font-weight: bold; background: #fee2e2; color: #dc2626;">Teacher View Mode - Read Only</span>
        <span v-else class="badge badge-orange">Task Mode ({{ assignmentType === 'coding' ? 'Coding' : 'Written' }} - Max Score: {{ maxScore }})</span>
        
        <q-btn
          v-if="!isTeacherMode"
          color="positive"
          icon="publish"
          :label="isReadOnly ? 'Submitted' : (assignmentType === 'coding' ? 'Submit Code' : 'Submit')"
          rounded
          unelevated
          :disable="isReadOnly"
          :loading="isSubmitting"
          @click="handleSubmitCode"
        />
      </div>
      <div v-else class="row items-center q-gutter-md">
        <span class="badge badge-gray">Free Play Mode</span>
        <q-btn
          v-if="!isTeacherMode"
          color="positive"
          icon="publish"
          label="Submit to Assignment"
          rounded
          unelevated
          @click="openSubmitToAssignmentDialog"
        />
      </div>
    </div>

    <!-- Language Selector Tabs (Coding mode only) -->
    <div v-if="assignmentType === 'coding' && !allCompilersDisabled" class="row justify-between items-center q-mb-lg">
      <div class="row q-gutter-sm">
        <q-btn
          v-if="!disabledCompilers.includes('java')"
          :flat="activeTab !== 'java'"
          :color="activeTab === 'java' ? 'primary' : 'grey-7'"
          label="Java Compiler"
          icon="code"
          rounded
          @click="activeTab = 'java'"
        />
        <q-btn
          v-if="!disabledCompilers.includes('sql')"
          :flat="activeTab !== 'sql'"
          :color="activeTab === 'sql' ? 'warning' : 'grey-7'"
          label="SQL Playground"
          icon="storage"
          rounded
          @click="activeTab = 'sql'"
        />
        <q-btn
          v-if="!disabledCompilers.includes('html')"
          :flat="activeTab !== 'html'"
          :color="activeTab === 'html' ? 'positive' : 'grey-7'"
          label="HTML/CSS Live"
          icon="web"
          rounded
          @click="activeTab = 'html'"
        />
      </div>

      <!-- Quick Submit Button (Visible next to tabs) -->
      <div class="row items-center q-gutter-md gt-xs">
        <q-btn
          v-if="!isTeacherMode && assignmentId"
          color="positive"
          icon="publish"
          :label="isReadOnly ? 'Submitted' : 'Submit Code'"
          rounded
          unelevated
          size="md"
          :disable="isReadOnly"
          :loading="isSubmitting"
          @click="handleSubmitCode"
        />
        <q-btn
          v-if="!isTeacherMode && !assignmentId"
          color="positive"
          icon="publish"
          label="Submit to Assignment"
          rounded
          unelevated
          size="md"
          @click="openSubmitToAssignmentDialog"
        />
      </div>
    </div>

    <!-- Active Editor Render -->
    <div class="q-mt-md">
      <!-- Written Works Layout -->
      <div v-if="assignmentType === 'written'" class="glass-card q-pa-lg">
        <p class="text-label q-mb-xs">WRITTEN RESPONSE ANSWER</p>
        <div class="editor-container">
          <textarea
            v-model="writtenResponse"
            class="code-textarea"
            placeholder="Type your written quiz answers or essay response here..."
            style="height: 400px; font-family: sans-serif; resize: vertical;"
            :readonly="isReadOnly"
            @copy.prevent="preventAction"
            @paste.prevent="preventAction"
            @cut.prevent="preventAction"
          ></textarea>
        </div>
        <div class="q-mt-md" v-if="!isReadOnly">
          <p class="text-label q-mb-xs">Upload File Attachment (Optional)</p>
          <input type="file" class="input-glass q-pa-sm" @change="e => submissionFile = e.target.files[0]" />
          <p class="text-caption text-muted q-mt-xs q-mb-none" v-if="existingSubmissionFilePath && existingSubmissionFilePath !== 'db_file'">
            A file is already attached. Uploading a new file will replace it.
          </p>
        </div>
        <div class="q-mt-md" v-if="existingSubmissionFilePath && existingSubmissionFilePath !== 'db_file' && isReadOnly">
          <p class="text-label q-mb-xs">Attached File</p>
          <q-btn
            outline
            color="info"
            icon="download"
            rounded
            dense
            label="Download Uploaded File"
            @click="downloadSubmissionAttachment"
          />
        </div>
      </div>

      <!-- Compilers Unavailable Notice -->
      <div v-else-if="allCompilersDisabled" class="glass-card q-pa-xl text-center">
        <q-icon name="warning" size="xl" color="warning" class="q-mb-md" />
        <h2 class="text-h5 text-warning font-weight-bold q-my-none">Compilers Unavailable</h2>
        <p class="text-body1 text-muted q-mt-md q-mb-none" style="max-width: 600px; margin-left: auto; margin-right: auto;">
          All coding playground compilers have been temporarily disabled by your administrator. 
          Please contact your instructor or administrator for assistance.
        </p>
      </div>

      <!-- Coding Playgrounds -->
      <template v-else>
        <div v-show="activeTab === 'java'">
          <!-- Loading skeleton while cloud projects are being fetched -->
          <div v-if="isLabLoading && !projectName" class="glass-card q-pa-xl text-center shadow-lg rounded-borders" style="max-width: 620px; margin: 40px auto;">
            <q-spinner-dots color="primary" size="48px" class="q-mb-md" />
            <p class="text-body2 text-grey-6">Restoring your project...</p>
          </div>
          <!-- If no project is loaded/named, show the project creation wizard -->
          <div v-else-if="!isLabLoading && !projectName && !assignmentId" class="glass-card q-pa-xl text-center shadow-lg rounded-borders" style="max-width: 620px; margin: 40px auto; background: #ffffff; border: 1px solid rgba(0, 122, 255, 0.15); box-shadow: 0 10px 30px rgba(0, 122, 255, 0.08);">
            <div class="q-mb-md flex flex-center">
              <div class="q-pa-md rounded-circle" style="background: rgba(0, 122, 255, 0.08); border: 1px solid rgba(0, 122, 255, 0.15); display: inline-flex;">
                <q-icon name="coffee" size="48px" color="primary" />
              </div>
            </div>
            <h2 class="text-h5 text-weight-bold q-my-none" style="color: #0d1b2a;">Create New Java Project</h2>
            <p class="text-body2 q-mt-sm q-mb-lg" style="color: #4a5568;">Specify your project details and select an OOP starter template to begin.</p>
            
            <!-- Open Existing Java Project Section -->
            <div v-if="javaProjectsList.length > 0" class="q-mb-lg text-left" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <div class="text-subtitle2 text-weight-bold q-mb-xs" style="color: #334155;">📂 Open Existing Project</div>
              <p class="text-caption text-grey-6 q-mb-sm">Switch back to any of your previous projects:</p>
              <div class="row q-gutter-sm">
                <q-btn 
                  v-for="projName in javaProjectsList" 
                  :key="projName" 
                  flat 
                  dense 
                  color="primary" 
                  icon="folder" 
                  :label="projName" 
                  @click="switchJavaProject(projName)"
                  class="q-px-sm text-capitalize"
                  style="background: #eef6ff; border-radius: 6px; font-size: 12px; font-weight: 600;"
                />
              </div>
            </div>

            <q-input 
              v-model="wizardProjName" 
              label="Project Name" 
              color="primary" 
              label-color="primary"
              input-style="color: #0d1b2a; font-weight: 500;"
              class="q-mb-md" 
              outlined 
              placeholder="e.g. MyOOPApplication" 
              style="background: #f8fafc; border-radius: 8px;"
            />
            <q-input 
              v-model="wizardBasePkg" 
              label="Base Package" 
              color="primary" 
              label-color="primary"
              input-style="color: #0d1b2a; font-weight: 500;"
              class="q-mb-lg" 
              outlined 
              placeholder="e.g. com.example.app" 
              style="background: #f8fafc; border-radius: 8px;"
            />
            
            <div class="text-subtitle2 text-left text-weight-bold q-mb-sm" style="color: #334155;">Choose Project Template</div>
            <div class="row q-col-gutter-sm q-mb-lg">
              <div class="col-6">
                <div 
                  class="template-card" 
                  :class="{ active: selectedTemplate === 'blank' }" 
                  @click="selectedTemplate = 'blank'"
                >
                  <div class="text-h6 q-mb-xs">📄</div>
                  <div class="text-weight-bold template-title">Blank Project</div>
                  <div class="text-caption template-desc">Empty project with Main.java</div>
                </div>
              </div>
              <div class="col-6">
                <div 
                  class="template-card" 
                  :class="{ active: selectedTemplate === 'oop' }" 
                  @click="selectedTemplate = 'oop'"
                >
                  <div class="text-h6 q-mb-xs">🏗️</div>
                  <div class="text-weight-bold template-title">OOP Starter</div>
                  <div class="text-caption template-desc">Polymorphism (Main, Animal, Dog)</div>
                </div>
              </div>
              <div class="col-6">
                <div 
                  class="template-card" 
                  :class="{ active: selectedTemplate === 'ds' }" 
                  @click="selectedTemplate = 'ds'"
                >
                  <div class="text-h6 q-mb-xs">🗃️</div>
                  <div class="text-weight-bold template-title">Data Structures</div>
                  <div class="text-caption template-desc">Stack, Queue, ArrayList demo</div>
                </div>
              </div>
              <div class="col-6">
                <div 
                  class="template-card" 
                  :class="{ active: selectedTemplate === 'design' }" 
                  @click="selectedTemplate = 'design'"
                >
                  <div class="text-h6 q-mb-xs">🎨</div>
                  <div class="text-weight-bold template-title">Design Patterns</div>
                  <div class="text-caption template-desc">Singleton & Factory patterns</div>
                </div>
              </div>
            </div>
            
            <q-btn 
              color="primary" 
              label="Create Java Project" 
              rounded 
              unelevated 
              @click="initJavaProject" 
              class="full-width q-py-sm text-weight-bold text-subtitle2" 
              style="background: linear-gradient(135deg, #007AFF, #0055b3); box-shadow: 0 4px 15px rgba(0, 122, 255, 0.25);"
            />
          </div>

          <!-- Otherwise, show the full Eclipse/NetBeans style IDE layout -->
          <div v-else class="row q-col-gutter-md">
            <!-- Sidebar: Project Explorer (Eclipse/NetBeans Style) -->
            <div class="col-12 col-md-3">
              <div class="glass-card q-pa-md height-100 project-explorer-card">
                <div class="row justify-between items-center q-mb-md border-bottom q-pb-sm">
                  <span class="text-caption text-weight-bold" style="color: #64748b;">PROJECT EXPLORER</span>
                  <div class="row q-gutter-xs">
                    <q-btn flat round dense size="sm" icon="create_new_folder" color="primary" @click="createNewProject" :disable="isReadOnly">
                      <q-tooltip>New Project</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense size="sm" icon="add" color="primary" @click="openNewClassDialog" :disable="isReadOnly">
                      <q-tooltip>New Class</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense size="sm" icon="refresh" color="grey-7" @click="resetJavaProject" :disable="isReadOnly">
                      <q-tooltip>Reset Project</q-tooltip>
                    </q-btn>
                  </div>
                </div>
                
                <!-- Project Tree list -->
                <div class="project-tree-container scroll">
                  <!-- Loop over all projects -->
                  <div class="project-node q-py-xs" v-for="proj in allParsedJavaProjects" :key="proj.name">
                    <div class="row items-center justify-between q-mb-xs">
                      <div class="row items-center q-gutter-xs text-weight-bold cursor-pointer" 
                           :style="proj.name === projectName ? 'color: #0f172a;' : 'color: #64748b;'"
                           @click="switchJavaProject(proj.name)">
                        <q-icon :name="proj.name === projectName ? 'folder_open' : 'folder'" :color="proj.name === projectName ? 'amber-9' : 'grey-7'" size="20px" />
                        <span>{{ proj.name }}</span>
                      </div>
                      <q-btn v-if="proj.name !== projectName && !isReadOnly" flat round dense size="xs" icon="delete" color="negative" @click.stop="deleteJavaProject(proj.name)">
                        <q-tooltip>Delete Project</q-tooltip>
                      </q-btn>
                    </div>
                    
                    <!-- Package structure (always visible) -->
                    <div class="package-nodes q-ml-md q-pl-xs border-left-dashed">
                      <div v-for="(pkgGroup, pkgName) in proj.groupedFiles" :key="pkgName" class="q-py-xs">
                        <div class="row items-center q-gutter-xs text-weight-bold" style="color: #475569;">
                          <q-icon name="inventory_2" color="blue-grey-6" size="16px" />
                          <span>{{ pkgName }}</span>
                        </div>
                        
                        <!-- Files under package -->
                        <div class="file-nodes q-ml-md">
                          <div 
                            v-for="file in pkgGroup" 
                            :key="file.name" 
                            class="file-node-row row justify-between items-center q-px-sm q-py-xs rounded-borders cursor-pointer q-mb-xs"
                            :style="{ background: (proj.name === projectName && activeJavaFileIndex === file.index) ? 'rgba(0, 122, 255, 0.12)' : 'transparent', color: (proj.name === projectName && activeJavaFileIndex === file.index) ? '#0055b3' : '#334155' }"
                            @click="switchJavaProjectAndFile(proj.name, file.index)"
                          >
                            <div class="row items-center q-gutter-xs">
                              <q-icon 
                                :name="file.type === 'interface' ? 'star_border' : file.type === 'abstract' ? 'architecture' : 'code'" 
                                :color="file.type === 'interface' ? 'cyan-8' : file.type === 'abstract' ? 'orange-9' : 'primary'" 
                                size="14px" 
                              />
                              <span class="text-caption text-weight-medium">{{ file.name }}</span>
                            </div>
                            <q-btn 
                              v-if="proj.name === projectName && file.name !== 'Main.java' && !isReadOnly" 
                              flat round dense size="xs" 
                              icon="close" 
                              color="negative" 
                              @click.stop="deleteJavaFile(file.name)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Right Column: Code Editor & Output Console -->
            <div class="col-12 col-md-9">
              <JavaEditor 
                ref="javaEditorRef" 
                :initial-code="javaFiles[activeJavaFileIndex]?.code || ''" 
                :all-files="javaFiles"
                :active-file-name="javaFiles[activeJavaFileIndex]?.name || 'Main.java'"
                :disabled="isReadOnly" 
                @change="handleJavaChange" 
              />
            </div>
          </div>
        </div>
        <div v-show="activeTab === 'sql'">
          <div class="row q-gutter-sm q-mb-md items-center">
            <q-btn
              v-for="(f, idx) in sqlFiles"
              :key="'sql-'+idx"
              :flat="activeSqlFileIndex !== idx"
              :color="activeSqlFileIndex === idx ? 'warning' : 'grey-7'"
              :label="f.name"
              size="sm"
              rounded
              @click="changeActiveSqlFile(idx)"
            />
            <q-btn flat round size="sm" icon="add" color="warning" @click="addSqlFile" :disable="isReadOnly"/>
            <q-btn flat round size="sm" icon="download" color="warning" @click="downloadSqlFile">
              <q-tooltip>Download SQL</q-tooltip>
            </q-btn>
          </div>
          <SqlEditor 
            ref="sqlEditorRef" 
            :initial-code="sqlFiles[activeSqlFileIndex]?.code || ''"
            :initial-db-buffer="sqlFiles[activeSqlFileIndex]?.buffer || null"
            :disabled="isReadOnly"
            @change="handleSqlChange"
          />
        </div>
        <div v-show="activeTab === 'html'">
          <!-- If no HTML project is created yet, show Project Creation Wizard -->
          <div v-if="!htmlProjectName && !assignmentId" class="glass-card q-pa-xl text-center shadow-lg rounded-borders" style="max-width: 650px; margin: 40px auto; background: #ffffff; border: 1px solid rgba(52, 199, 89, 0.2); box-shadow: 0 10px 30px rgba(52, 199, 89, 0.08);">
            <div class="q-mb-md flex flex-center">
              <div class="q-pa-md rounded-circle" style="background: rgba(52, 199, 89, 0.08); border: 1px solid rgba(52, 199, 89, 0.15); display: inline-flex;">
                <q-icon name="web" size="48px" color="positive" />
              </div>
            </div>
            <h2 class="text-h5 text-weight-bold q-my-none" style="color: #0d1b2a;">Create New HTML/CSS Web Project</h2>
            <p class="text-body2 q-mt-sm q-mb-lg" style="color: #4a5568;">Build responsive websites with HTML, CSS, JavaScript, and Image assets.</p>

            <!-- Open Existing HTML Project Section -->
            <div v-if="htmlProjectsList.length > 0" class="q-mb-lg text-left" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <div class="text-subtitle2 text-weight-bold q-mb-xs" style="color: #334155;">📂 Open Existing Project</div>
              <p class="text-caption text-grey-6 q-mb-sm">Switch back to any of your previous web projects:</p>
              <div class="row q-gutter-sm">
                <q-btn 
                  v-for="projName in htmlProjectsList" 
                  :key="projName" 
                  flat 
                  dense 
                  color="positive" 
                  icon="folder_zip" 
                  :label="projName" 
                  @click="switchHtmlProject(projName)"
                  class="q-px-sm text-capitalize"
                  style="background: #f0fdf4; border-radius: 6px; font-size: 12px; font-weight: 600;"
                />
              </div>
            </div>

            <q-input 
              v-model="htmlWizardProjName" 
              label="Project Name" 
              color="positive" 
              label-color="positive"
              input-style="color: #0d1b2a; font-weight: 500;"
              class="q-mb-lg" 
              outlined 
              placeholder="e.g. MyWebPortfolio" 
              style="background: #f8fafc; border-radius: 8px;"
            />

            <div class="text-subtitle2 text-left text-weight-bold q-mb-sm" style="color: #334155;">Choose Web Project Template</div>
            <div class="row q-col-gutter-sm q-mb-lg">
              <div class="col-6">
                <div 
                  class="template-card" 
                  :class="{ active: htmlSelectedTemplate === 'blank' }" 
                  @click="htmlSelectedTemplate = 'blank'"
                >
                  <div class="text-h6 q-mb-xs">📄</div>
                  <div class="text-weight-bold template-title">Blank Web Page</div>
                  <div class="text-caption template-desc">index.html, style.css, script.js</div>
                </div>
              </div>
              <div class="col-6">
                <div 
                  class="template-card" 
                  :class="{ active: htmlSelectedTemplate === 'landing' }" 
                  @click="htmlSelectedTemplate = 'landing'"
                >
                  <div class="text-h6 q-mb-xs">🎨</div>
                  <div class="text-weight-bold template-title">Landing Page</div>
                  <div class="text-caption template-desc">Hero section, CSS grid & flex styling</div>
                </div>
              </div>
              <div class="col-6">
                <div 
                  class="template-card" 
                  :class="{ active: htmlSelectedTemplate === 'gallery' }" 
                  @click="htmlSelectedTemplate = 'gallery'"
                >
                  <div class="text-h6 q-mb-xs">🖼️</div>
                  <div class="text-weight-bold template-title">Image Gallery</div>
                  <div class="text-caption template-desc">HTML + CSS grid & pre-seeded images</div>
                </div>
              </div>
              <div class="col-6">
                <div 
                  class="template-card" 
                  :class="{ active: htmlSelectedTemplate === 'app' }" 
                  @click="htmlSelectedTemplate = 'app'"
                >
                  <div class="text-h6 q-mb-xs">⚡</div>
                  <div class="text-weight-bold template-title">Interactive App</div>
                  <div class="text-caption template-desc">HTML UI + JS DOM manipulation demo</div>
                </div>
              </div>
            </div>

            <q-btn color="positive" label="Create Web Project" rounded unelevated @click="initHtmlProject" class="full-width q-py-sm text-weight-bold text-subtitle2" style="background: linear-gradient(135deg, #34c759, #28a745); box-shadow: 0 4px 15px rgba(52, 199, 89, 0.25);" />
          </div>

          <!-- HTML Project Explorer & Editor Layout -->
          <div v-else class="row q-col-gutter-md">
            <!-- Sidebar: HTML Project Explorer -->
            <div class="col-12 col-md-3">
              <div class="glass-card q-pa-md height-100 project-explorer-card">
                <div class="row justify-between items-center q-mb-md border-bottom q-pb-sm">
                  <span class="text-caption text-weight-bold" style="color: #64748b;">WEB EXPLORER</span>
                  <div class="row q-gutter-xs">
                    <q-btn flat round dense size="sm" icon="note_add" color="positive" @click="openNewHtmlFileDialog" :disable="isReadOnly">
                      <q-tooltip>New File (.html, .css, .js)</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense size="sm" icon="add_photo_alternate" color="info" @click="triggerImageUpload" :disable="isReadOnly">
                      <q-tooltip>Upload Image Asset</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense size="sm" icon="refresh" color="grey-7" @click="resetHtmlProject" :disable="isReadOnly">
                      <q-tooltip>Reset Project</q-tooltip>
                    </q-btn>
                  </div>
                </div>

                <!-- Hidden file input for images -->
                <input ref="imageFileInput" type="file" accept="image/*" style="display: none;" @change="uploadHtmlImage" />

                <!-- Scrollable Tree & Assets -->
                <div class="project-tree-container scroll">
                  <!-- Loop over HTML projects -->
                  <div class="project-node q-py-xs q-mb-md" v-for="proj in allParsedHtmlProjects" :key="proj.name">
                    <div class="row items-center justify-between q-mb-sm">
                      <div class="row items-center q-gutter-xs text-weight-bold cursor-pointer" 
                           :style="proj.name === htmlProjectName ? 'color: #0f172a;' : 'color: #64748b;'"
                           @click="switchHtmlProject(proj.name)">
                        <q-icon name="folder_zip" :color="proj.name === htmlProjectName ? 'positive' : 'grey-7'" size="20px" />
                        <span>{{ proj.name }}</span>
                      </div>
                      <q-btn v-if="proj.name !== htmlProjectName && !isReadOnly" flat round dense size="xs" icon="delete" color="negative" @click.stop="deleteHtmlProject(proj.name)">
                        <q-tooltip>Delete Project</q-tooltip>
                      </q-btn>
                    </div>

                    <!-- Code Files Section -->
                    <div class="q-ml-sm q-mb-md">
                      <div class="row items-center justify-between text-caption text-weight-bold q-mb-xs" style="color: #64748b;">
                        <span>CODE FILES ({{ proj.files.length }})</span>
                      </div>
                      <div 
                        v-for="(file, idx) in proj.files" 
                        :key="'html-file-'+idx"
                        class="file-node-row row justify-between items-center q-px-sm q-py-xs rounded-borders cursor-pointer q-mb-xs"
                        :style="{ background: (proj.name === htmlProjectName && activeHtmlFileIndex === idx) ? 'rgba(34, 197, 94, 0.15)' : 'transparent', color: (proj.name === htmlProjectName && activeHtmlFileIndex === idx) ? '#15803d' : '#334155' }"
                        @click="switchHtmlProjectAndFile(proj.name, idx)"
                      >
                        <div class="row items-center q-gutter-xs overflow-hidden">
                          <q-icon 
                            :name="file.name.endsWith('.html') ? 'html' : file.name.endsWith('.css') ? 'palette' : 'javascript'" 
                            :color="file.name.endsWith('.html') ? 'orange-9' : file.name.endsWith('.css') ? 'cyan-8' : 'yellow-9'" 
                            size="16px" 
                          />
                          <span class="text-caption text-weight-medium ellipsis" style="max-width: 110px;">{{ file.name }}</span>
                        </div>
                        <q-btn 
                          v-if="proj.name === htmlProjectName && file.name !== 'index.html' && !isReadOnly" 
                          flat round dense size="xs" 
                          icon="close" 
                          color="negative" 
                          @click.stop="deleteHtmlFile(idx)"
                        />
                      </div>
                    </div>

                    <!-- Images & Assets Section -->
                    <div class="q-ml-sm">
                      <div class="row items-center justify-between text-caption text-weight-bold q-mb-xs" style="color: #64748b;">
                        <span>IMAGES & ASSETS ({{ proj.images.length }})</span>
                        <q-btn v-if="proj.name === htmlProjectName" flat dense size="xs" color="info" label="+ Add URL" @click="showAddImageUrlDialog = true" :disable="isReadOnly" />
                      </div>

                      <div v-if="proj.images.length === 0" class="text-caption italic q-pa-xs" style="color: #94a3b8;">
                        No images uploaded yet.
                      </div>

                      <div 
                        v-for="(img, imgIdx) in proj.images" 
                        :key="'html-img-'+imgIdx"
                        class="file-node-row row justify-between items-center q-px-sm q-py-xs rounded-borders cursor-pointer q-mb-xs"
                        style="background: rgba(0, 0, 0, 0.03);"
                      >
                        <div class="row items-center q-gutter-xs overflow-hidden" @click="viewImageDetail(img)">
                          <q-avatar size="20px" square rounded>
                            <img :src="img.url" alt="preview" style="object-fit: cover;" />
                          </q-avatar>
                          <span class="text-caption text-weight-medium ellipsis" style="max-width: 100px; color: #1e293b;">{{ img.name }}</span>
                        </div>
                        <div class="row q-gutter-none">
                          <q-btn flat round dense size="xs" icon="content_copy" color="info" @click.stop="copyImgTag(img.name)">
                            <q-tooltip>Copy &lt;img src="{{ img.name }}"&gt;</q-tooltip>
                          </q-btn>
                          <q-btn v-if="proj.name === htmlProjectName && !isReadOnly" flat round dense size="xs" icon="close" color="negative" @click.stop="deleteHtmlImage(imgIdx)" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Main Editor Column -->
            <div class="col-12 col-md-9">
              <HtmlEditor 
                ref="htmlEditorRef" 
                :initial-code="htmlFiles[activeHtmlFileIndex]?.code || ''" 
                :all-files="htmlFiles"
                :all-images="htmlImages"
                :active-file-name="htmlFiles[activeHtmlFileIndex]?.name || ''"
                :disabled="isReadOnly" 
                @change="handleHtmlChange" 
              />
            </div>
          </div>
        </div>
      </template>

    <!-- New Java Class Dialog Modal -->
    <q-dialog v-model="showNewClassDialog" persistent>
      <q-card dark class="glass-card" style="min-width: 400px; border: 1px solid rgba(255,255,255,0.1); background: #181d28;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 font-weight-bold text-white">New Java Class</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-gutter-md q-pt-md">
          <q-input v-model="newClassName" label="Class Name" dark color="primary" outlined placeholder="e.g. Dog" />
          <q-input v-model="newClassPkg" label="Package" dark color="primary" outlined placeholder="e.g. com.example.app" />
          
          <div class="text-caption text-grey-4">Class Type</div>
          <div class="row q-gutter-sm">
            <q-radio v-model="newClassType" val="class" label="Class" dark color="primary" />
            <q-radio v-model="newClassType" val="abstract" label="Abstract Class" dark color="primary" />
            <q-radio v-model="newClassType" val="interface" label="Interface" dark color="primary" />
            <q-radio v-model="newClassType" val="enum" label="Enum" dark color="primary" />
          </div>

          <q-input v-model="newClassExtends" label="Extends (optional)" dark color="primary" outlined placeholder="e.g. Animal" v-if="newClassType === 'class' || newClassType === 'abstract'" />
          <q-input v-model="newClassImplements" label="Implements (optional)" dark color="primary" outlined placeholder="e.g. Serializable" v-if="newClassType === 'class' || newClassType === 'abstract'" />

          <div class="q-gutter-xs" v-if="newClassType === 'class'">
            <q-checkbox v-model="genCtor" label="Generate Constructor" dark color="primary" />
            <q-checkbox v-model="genMain" label="Generate main() method" dark color="primary" />
            <q-checkbox v-model="genToString" label="Generate toString()" dark color="primary" />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" color="grey-4" v-close-popup />
          <q-btn label="Create Class" color="primary" rounded unelevated @click="createNewJavaClass" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- New HTML / Web File Dialog Modal -->
    <q-dialog v-model="showNewHtmlFileDialog" persistent>
      <q-card dark class="glass-card" style="min-width: 400px; border: 1px solid rgba(255,255,255,0.1); background: #181d28;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 font-weight-bold text-white">New Web File</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-gutter-md q-pt-md">
          <q-input v-model="newHtmlFileName" label="File Name" dark color="positive" outlined placeholder="e.g. about.html, style.css, script.js" />
          
          <div class="text-caption text-grey-4">File Extension / Type</div>
          <div class="row q-gutter-sm">
            <q-radio v-model="newHtmlFileType" val="html" label="HTML (.html)" dark color="positive" />
            <q-radio v-model="newHtmlFileType" val="css" label="CSS (.css)" dark color="positive" />
            <q-radio v-model="newHtmlFileType" val="js" label="JS (.js)" dark color="positive" />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" color="grey-4" v-close-popup />
          <q-btn label="Create File" color="positive" rounded unelevated @click="createNewHtmlFile" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- View Image Modal -->
    <q-dialog v-model="showImageModal">
      <q-card dark class="glass-card" style="min-width: 420px; border: 1px solid rgba(255,255,255,0.1); background: #181d28;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 font-weight-bold text-white">{{ selectedImageForView?.name || 'Image Preview' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="text-center q-pa-md">
          <img :src="selectedImageForView?.url" style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" />
          <div class="text-caption text-grey-4 q-mt-sm" v-if="selectedImageForView?.size">Size: {{ selectedImageForView.size }}</div>
          <div class="q-mt-md">
            <code style="background: rgba(0,0,0,0.5); padding: 6px 12px; border-radius: 6px; color: #4ade80;" class="text-caption">
              &lt;img src="{{ selectedImageForView?.name }}" alt="{{ selectedImageForView?.name }}"&gt;
            </code>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Copy HTML Tag" color="positive" @click="copyImgTag(selectedImageForView?.name)" />
          <q-btn flat label="Close" color="grey-4" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Image URL Dialog -->
    <q-dialog v-model="showAddImageUrlDialog" persistent>
      <q-card dark class="glass-card" style="min-width: 400px; border: 1px solid rgba(255,255,255,0.1); background: #181d28;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 font-weight-bold text-white">Add Image by URL</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-gutter-md q-pt-md">
          <q-input v-model="newImageUrlName" label="Asset Name in HTML" dark color="info" outlined placeholder="e.g. hero-banner.jpg" />
          <q-input v-model="newImageUrlSrc" label="Image Web URL" dark color="info" outlined placeholder="e.g. https://images.unsplash.com/photo-..." />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" color="grey-4" v-close-popup />
          <q-btn label="Add Image Asset" color="info" rounded unelevated @click="addHtmlImageByUrl" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Submit To Assignment Dialog -->
    <q-dialog v-model="showSubmitToAssignmentDialog" persistent>
      <q-card class="glass-q-card" style="width: 500px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6 text-primary font-weight-bold">Submit to Assignment</div>
          <p class="text-caption text-grey-6 q-mb-none">Select an assignment to submit your current code to.</p>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-select
            v-model="selectedSubmitAssignment"
            :options="pendingAssignments"
            option-value="id"
            option-label="title"
            label="Select Assignment"
            outlined
            color="primary"
            class="q-mb-md"
            emit-value
            map-options
            :loading="isLoadingAssignments"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  No pending coding assignments found
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn label="Cancel" flat rounded color="grey-7" v-close-popup />
          <q-btn label="Submit" color="positive" rounded unelevated @click="confirmSubmitToAssignment" :disable="!selectedSubmitAssignment" :loading="isSubmitting" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Sticky Floating Submit Button (Bottom Right) -->
    <div v-if="!isTeacherMode" style="position: fixed; bottom: 30px; right: 30px; z-index: 9999;">
      <q-btn
        v-if="assignmentId"
        color="positive"
        icon="publish"
        :label="isReadOnly ? 'Submitted' : 'Submit Code'"
        rounded
        unelevated
        size="lg"
        padding="12px 24px"
        class="shadow-4"
        :disable="isReadOnly"
        :loading="isSubmitting"
        @click="handleSubmitCode"
      >
        <q-tooltip anchor="top middle" self="bottom middle">Submit current assignment</q-tooltip>
      </q-btn>
      <q-btn
        v-else
        color="positive"
        icon="publish"
        label="Submit to Assignment"
        rounded
        unelevated
        size="lg"
        padding="12px 24px"
        class="shadow-4"
        @click="openSubmitToAssignmentDialog"
      >
        <q-tooltip anchor="top middle" self="bottom middle">Submit this code to a pending assignment</q-tooltip>
      </q-btn>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useLmsStore } from '../../stores/LMS/lmsStore';
import { useAuthStore } from '../../stores/auth';
import lmsService, { sqlSandboxService, javaSandboxService, htmlSandboxService } from '../../services/LMS/lmsService';
import API from '../../services/api';
import { bufferToBase64, base64ToBuffer } from '../../utils/base64';
import JavaEditor from '../../components/LMS/Editors/JavaEditor.vue';
import SqlEditor from '../../components/LMS/Editors/SqlEditor.vue';
import HtmlEditor from '../../components/LMS/Editors/HtmlEditor.vue';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const lmsStore = useLmsStore();
const authStore = useAuthStore();

const activeTab = ref('java');
const disabledCompilers = ref([]);
const allJavaProjects = ref([]);
const allHtmlProjects = ref([]);

const javaProjectsList = computed(() => {
  return allJavaProjects.value.map(p => p.project_name);
});
const htmlProjectsList = computed(() => {
  return allHtmlProjects.value.map(p => p.project_name);
});

const allCompilersDisabled = computed(() => {
  return ['java', 'sql', 'html'].every(lang => disabledCompilers.value.includes(lang));
});

const getFallbackTab = (desiredTab) => {
  const allTabs = ['java', 'sql', 'html'];
  if (!disabledCompilers.value.includes(desiredTab)) {
    return desiredTab;
  }
  const fallback = allTabs.find(tab => !disabledCompilers.value.includes(tab));
  return fallback || desiredTab;
};
const assignmentId = ref(null);
const maxScore = ref(0);
const isSubmitting = ref(false);
const isTeacherMode = ref(false);
const teacherSubmissionId = ref(null);

// Isolated initial code states to prevent tab contamination
const javaFiles = ref([{ name: 'Main.java', code: '', pkg: 'com.myapp', type: 'class' }]);
const htmlFiles = ref([{ name: 'index.html', code: '' }]);
const activeJavaFileIndex = ref(0);
const activeHtmlFileIndex = ref(0);

const projectName = ref('');
const wizardProjName = ref('');
const isLabLoading = ref(false); // true while cloud projects are being fetched on first load
const wizardBasePkg = ref('com.myapp');
const selectedTemplate = ref('blank');

// HTML Project state
const htmlProjectName = ref('');
const htmlWizardProjName = ref('');
const htmlSelectedTemplate = ref('blank');
const htmlImages = ref([]);
const imageFileInput = ref(null);

// HTML Dialog state
const showNewHtmlFileDialog = ref(false);
const newHtmlFileName = ref('');
const newHtmlFileType = ref('html');

const showImageModal = ref(false);
const selectedImageForView = ref(null);

const showAddImageUrlDialog = ref(false);
const newImageUrlName = ref('');
const newImageUrlSrc = ref('');

// New Class dialog state
const showNewClassDialog = ref(false);
const newClassName = ref('');
const newClassPkg = ref('com.myapp');
const newClassType = ref('class');
const newClassExtends = ref('');
const newClassImplements = ref('');
const genMain = ref(false);
const genCtor = ref(true);
const genToString = ref(false);

const sqlFiles = ref([{ name: 'main.db', code: '', buffer: null }]);
const activeSqlFileIndex = ref(0);

const saveStatus = ref('All changes saved');
const writtenResponse = ref('');
const submissionFile = ref(null);
const existingSubmissionFilePath = ref(null);
const isOnline = ref(navigator.onLine);
const submissionStatus = ref(null);

const isReadOnly = computed(() => {
  return submissionStatus.value === 'submitted' || submissionStatus.value === 'graded';
});

// Refs to editor components
const javaEditorRef = ref(null);
const sqlEditorRef = ref(null);
const htmlEditorRef = ref(null);

const preventAction = (e) => {
  $q.notify({
    type: 'negative',
    message: 'Copying/Pasting is disabled for this assignment.',
    position: 'top',
    timeout: 2000
  });
};

const assignment = computed(() => {
  return lmsStore.assignments.find(a => a.id === assignmentId.value);
});

const assignmentType = computed(() => {
  return assignment.value?.type || 'coding';
});

const getActiveCode = () => {
  if (assignmentType.value === 'written') {
    return writtenResponse.value;
  }
  if (activeTab.value === 'java') {
    return JSON.stringify({
      projectName: projectName.value,
      files: javaFiles.value
    });
  }
  if (activeTab.value === 'sql') {
    return JSON.stringify(sqlFiles.value.map(f => ({ name: f.name, code: f.code })));
  }
  if (activeTab.value === 'html') {
    return JSON.stringify({
      projectName: htmlProjectName.value,
      files: htmlFiles.value,
      images: htmlImages.value
    });
  }
  return '';
};

// Check if content structure looks like HTML or Java
const isHtml = (content) => {
  if (!content) return false;
  const lower = content.toLowerCase();
  return lower.includes('<html') || lower.includes('<!doctype') || lower.includes('<body>') || lower.includes('<h1>');
};

const isJava = (content) => {
  if (!content) return false;
  return content.includes('class ') || content.includes('System.out') || content.includes('public static void main');
};

const loadJavaDraft = (draftStr) => {
  if (!draftStr) {
    return [{ name: 'Main.java', code: '', pkg: 'com.myapp', type: 'class' }];
  }
  try {
    const parsed = JSON.parse(draftStr);
    if (Array.isArray(parsed)) {
      projectName.value = '';
      return parsed;
    } else if (parsed && Array.isArray(parsed.files)) {
      projectName.value = parsed.projectName || '';
      return parsed.files;
    }
  } catch (e) {
    projectName.value = '';
    return [{ name: 'Main.java', code: draftStr, pkg: 'com.myapp', type: 'class' }];
  }
  projectName.value = '';
  return [{ name: 'Main.java', code: '', pkg: 'com.myapp', type: 'class' }];
};

const getStorageKey = (baseKey) => {
  const userId = authStore.user?.id || 'guest';
  return `${baseKey}_user_${userId}`;
};

const getAssignmentLanguage = (codeVal) => {
  const title = assignment.value?.title || '';
  const desc = assignment.value?.description || '';
  if (
    title.toLowerCase().includes('html') ||
    title.toLowerCase().includes('css') ||
    desc.toLowerCase().includes('html') ||
    desc.toLowerCase().includes('css')
  ) {
    return 'html';
  }
  if (
    title.toLowerCase().includes('sql') ||
    desc.toLowerCase().includes('sql') ||
    desc.toLowerCase().includes('database')
  ) {
    return 'sql';
  }
  if (codeVal && isHtml(codeVal)) {
    return 'html';
  }
  return 'java';
};

// Save handlers
let saveTimeout = null;

const groupedJavaFiles = computed(() => {
  const groups = {};
  javaFiles.value.forEach((file, index) => {
    const pkg = file.pkg || '(default)';
    if (!groups[pkg]) groups[pkg] = [];
    groups[pkg].push({ ...file, index });
  });
  return groups;
});

const allParsedJavaProjects = computed(() => {
  return allJavaProjects.value.map(proj => {
    let files = [];
    try {
      const parsed = JSON.parse(proj.project_data);
      files = parsed.files || parsed || [];
    } catch (e) {
      files = [];
    }
    
    // Check if this is the active project; if so, we can just use javaFiles to ensure real-time UI updates
    if (proj.project_name === projectName.value) {
      files = javaFiles.value;
    }
    
    const groups = {};
    files.forEach((file, index) => {
      const pkg = file.pkg || '(default)';
      if (!groups[pkg]) groups[pkg] = [];
      groups[pkg].push({ ...file, index });
    });
    
    return {
      name: proj.project_name,
      groupedFiles: groups
    };
  });
});

const allParsedHtmlProjects = computed(() => {
  return allHtmlProjects.value.map(proj => {
    let files = [];
    let images = [];
    try {
      const parsed = JSON.parse(proj.project_data);
      files = parsed.files || [{ name: 'index.html', code: '' }];
      images = parsed.images || [];
    } catch (e) {
      files = [{ name: 'index.html', code: '' }];
      images = [];
    }
    
    // For active project, use real-time arrays
    if (proj.project_name === htmlProjectName.value) {
      files = htmlFiles.value;
      images = htmlImages.value;
    }
    
    return {
      name: proj.project_name,
      files,
      images
    };
  });
});

const switchJavaProjectAndFile = (projName, fileIndex) => {
  if (projName !== projectName.value) {
    switchJavaProject(projName);
  }
  activeJavaFileIndex.value = fileIndex;
};

const switchHtmlProjectAndFile = (projName, fileIndex) => {
  if (projName !== htmlProjectName.value) {
    switchHtmlProject(projName);
  }
  activeHtmlFileIndex.value = fileIndex;
};

const deleteJavaFile = (name) => {
  if (confirm(`Are you sure you want to delete ${name}?`)) {
    const idx = getJavaFileIndex(name);
    if (idx !== -1) {
      javaFiles.value.splice(idx, 1);
      if (activeJavaFileIndex.value >= javaFiles.value.length) {
        activeJavaFileIndex.value = 0;
      }
      saveCode(JSON.stringify({ projectName: projectName.value, files: javaFiles.value }), 'java');
    }
  }
};

const resetJavaProject = () => {
  if (confirm('Are you sure you want to reset the current Java project? This will delete all custom files.')) {
    projectName.value = '';
    wizardProjName.value = '';
    wizardBasePkg.value = 'com.myapp';
    javaFiles.value = [{ name: 'Main.java', code: '', pkg: 'com.myapp', type: 'class' }];
    activeJavaFileIndex.value = 0;
    saveCode(JSON.stringify({ projectName: '', files: javaFiles.value }), 'java');
  }
};

const createNewProject = () => {
  projectName.value = '';
  wizardProjName.value = '';
  wizardBasePkg.value = 'com.myapp';
  selectedTemplate.value = 'blank';
  javaFiles.value = [{ name: 'Main.java', code: '', pkg: 'com.myapp', type: 'class' }];
  activeJavaFileIndex.value = 0;
};

const switchJavaProject = (projName) => {
  const proj = allJavaProjects.value.find(p => p.project_name === projName);
  if (proj) {
    projectName.value = proj.project_name;
    wizardProjName.value = proj.project_name;
    const parsed = JSON.parse(proj.project_data);
    if (parsed) {
      javaFiles.value = parsed.files || parsed;
      activeJavaFileIndex.value = 0;
      localStorage.setItem(getStorageKey('sms_lab_active_java_project'), proj.project_name);
      localStorage.setItem(
        getStorageKey(`sms_lab_freeplay_java_${proj.project_name}`),
        JSON.stringify({ projectName: proj.project_name, files: javaFiles.value })
      );
    }
  }
};

const switchHtmlProject = (projName) => {
  const proj = allHtmlProjects.value.find(p => p.project_name === projName);
  if (proj) {
    htmlProjectName.value = proj.project_name;
    htmlWizardProjName.value = proj.project_name;
    const parsed = JSON.parse(proj.project_data);
    if (parsed) {
      htmlFiles.value = parsed.files || [{ name: 'index.html', code: '' }];
      htmlImages.value = parsed.images || [];
      activeHtmlFileIndex.value = 0;
      localStorage.setItem(getStorageKey('sms_lab_active_html_project'), proj.project_name);
      localStorage.setItem(
        getStorageKey(`sms_lab_freeplay_html_${proj.project_name}`),
        JSON.stringify({ projectName: proj.project_name, files: htmlFiles.value, images: htmlImages.value })
      );
    }
  }
};

const openNewClassDialog = () => {
  newClassName.value = '';
  newClassPkg.value = wizardBasePkg.value || 'com.myapp';
  newClassType.value = 'class';
  newClassExtends.value = '';
  newClassImplements.value = '';
  genMain.value = false;
  genCtor.value = true;
  genToString.value = false;
  showNewClassDialog.value = true;
};

const createNewJavaClass = () => {
  const name = newClassName.value.trim();
  if (!name || !/^[A-Z][a-zA-Z0-9_]*$/.test(name)) {
    $q.notify({ type: 'negative', message: 'Class name must start with uppercase and contain only letters/numbers/underscores.' });
    return;
  }
  
  const pkg = newClassPkg.value.trim() || 'com.myapp';
  const fileName = name + '.java';
  
  if (javaFiles.value.some(f => f.name.toLowerCase() === fileName.toLowerCase())) {
    $q.notify({ type: 'negative', message: `File "${fileName}" already exists.` });
    return;
  }
  
  const newClass = {
    name: fileName,
    pkg: pkg,
    type: newClassType.value,
    code: generateClassContent(
      name,
      pkg,
      newClassType.value,
      newClassExtends.value.trim(),
      newClassImplements.value.trim(),
      genMain.value,
      genCtor.value,
      genToString.value
    )
  };
  
  javaFiles.value.push(newClass);
  activeJavaFileIndex.value = javaFiles.value.length - 1;
  saveCode(JSON.stringify({ projectName: projectName.value, files: javaFiles.value }), 'java');
  showNewClassDialog.value = false;
  
  $q.notify({ type: 'positive', message: `Created class ${name}` });
};

const initJavaProject = () => {
  const name = wizardProjName.value.trim();
  const pkg = wizardBasePkg.value.trim() || 'com.myapp';
  if (!name) {
    $q.notify({ type: 'negative', message: 'Project Name is required.' });
    return;
  }
  
  projectName.value = name;
  wizardProjName.value = name;
  wizardBasePkg.value = pkg;
  localStorage.setItem(getStorageKey('sms_lab_active_java_project'), name);
  
  const files = [];
  if (selectedTemplate.value === 'oop') {
    files.push(
      { name: 'Animal.java', pkg, type: 'class', code: OOP_ANIMAL_TEMPLATE(pkg) },
      { name: 'Dog.java', pkg, type: 'class', code: OOP_DOG_TEMPLATE(pkg) },
      { name: 'Main.java', pkg, type: 'class', code: OOP_MAIN_TEMPLATE(pkg) }
    );
  } else if (selectedTemplate.value === 'ds') {
    files.push({ name: 'Main.java', pkg, type: 'class', code: DS_TEMPLATE(pkg) });
  } else if (selectedTemplate.value === 'design') {
    files.push({ name: 'Main.java', pkg, type: 'class', code: DESIGN_TEMPLATE(pkg) });
  } else {
    files.push({ name: 'Main.java', pkg, type: 'class', code: generateClassContent('Main', pkg, 'class', '', '', true, false, false) });
  }
  
  javaFiles.value = files;
  activeJavaFileIndex.value = files.findIndex(f => f.name === 'Main.java');
  if (activeJavaFileIndex.value === -1) activeJavaFileIndex.value = 0;
  
  saveCode(JSON.stringify({ projectName: projectName.value, files: javaFiles.value }), 'java');
};

const generateClassContent = (name, pkg, type, ext, impl, hasMain, hasCtor, hasToStr) => {
  let lines = [];
  if (pkg) lines.push(`package ${pkg};`, '');
  const impls = impl ? ` implements ${impl}` : '';
  const exts  = ext  ? ` extends ${ext}`    : '';

  if (type === 'interface') {
    lines.push(`public interface ${name}${impls} {`, '    ', '}');
  } else if (type === 'enum') {
    lines.push(`public enum ${name} {`, '    VALUE1, VALUE2, VALUE3;', '    ', '}');
  } else if (type === 'abstract') {
    lines.push(`public abstract class ${name}${exts}${impls} {`, '    ');
    if (hasCtor) lines.push(`    public ${name}() {\n    }\n    `);
    lines.push(`    public abstract void abstractMethod();`, '    ', '}');
  } else {
    lines.push(`public class ${name}${exts}${impls} {`, '    ');
    if (hasCtor) lines.push(`    public ${name}() {\n        // Constructor\n    }\n    `);
    if (hasMain) lines.push(`    public static void main(String[] args) {\n        System.out.println("Hello from ${name}!");\n    }\n    `);
    if (hasToStr) lines.push(`    @Override\n    public String toString() {\n        return "${name}{}";\n    }\n    `);
    lines.push('}');
  }
  return lines.join('\n');
};

// ── OOP Starter Templates ──
const OOP_ANIMAL_TEMPLATE = pkg => `package ${pkg};

public abstract class Animal {
    private String name;
    private int age;

    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public abstract void makeSound();

    public void eat() {
        System.out.println(name + " is eating.");
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    @Override
    public String toString() {
        return "Animal{name='" + name + "', age=" + age + "}";
    }
}`;

const OOP_DOG_TEMPLATE = pkg => `package ${pkg};

public class Dog extends Animal {
    private String breed;

    public Dog(String name, int age, String breed) {
        super(name, age);
        this.breed = breed;
    }

    @Override
    public void makeSound() {
        System.out.println(getName() + " says: Woof!");
    }

    public void fetch() {
        System.out.println(getName() + " is fetching the ball!");
    }

    public String getBreed() { return breed; }

    @Override
    public String toString() {
        return "Dog{name='" + getName() + "', breed='" + breed + "'}";
    }
}`;

const OOP_MAIN_TEMPLATE = pkg => `package ${pkg};

public class Main {
    public static void main(String[] args) {
        Animal myDog = new Dog("Buddy", 3, "Labrador");

        System.out.println("=== OOP Demo ===");
        System.out.println(myDog);
        myDog.makeSound();
        myDog.eat();

        Dog dog = (Dog) myDog;
        dog.fetch();

        System.out.println("\\nDone!");
    }
}`;

const DS_TEMPLATE = pkg => `package ${pkg};

import java.util.Stack;
import java.util.LinkedList;
import java.util.Queue;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        Stack<Integer> stack = new Stack<>();
        stack.push(1); stack.push(2); stack.push(3);
        System.out.println("Stack top: " + stack.peek());

        Queue<String> queue = new LinkedList<>();
        queue.offer("first"); queue.offer("second");
        System.out.println("Queue head: " + queue.poll());

        ArrayList<String> list = new ArrayList<>();
        list.add("Java"); list.add("OOP");
        for (String item : list) System.out.println("  - " + item);
    }
}`;

const DESIGN_TEMPLATE = pkg => `package ${pkg};

class DatabaseConnection {
    private static DatabaseConnection instance;
    private String url;

    private DatabaseConnection() { this.url = "jdbc:mysql://localhost/mydb"; }

    public static DatabaseConnection getInstance() {
        if (instance == null) instance = new DatabaseConnection();
        return instance;
    }
    public String getUrl() { return url; }
}

interface Shape { void draw(); }
class Circle implements Shape { public void draw() { System.out.println("Drawing Circle"); } }
class Square implements Shape { public void draw() { System.out.println("Drawing Square"); } }

class ShapeFactory {
    public static Shape create(String type) {
        if ("circle".equalsIgnoreCase(type)) return new Circle();
        if ("square".equalsIgnoreCase(type)) return new Square();
        throw new IllegalArgumentException("Unknown shape: " + type);
    }
}

public class Main {
    public static void main(String[] args) {
        DatabaseConnection db1 = DatabaseConnection.getInstance();
        DatabaseConnection db2 = DatabaseConnection.getInstance();
        System.out.println("Same DB instance? " + (db1 == db2));

        Shape s1 = ShapeFactory.create("circle");
        s1.draw();
    }
}`;

// ── HTML Web Project Templates & Helper Functions ─────────────────────────────────
const HTML_BLANK_INDEX = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <script src="script.js"><\/script>
</body>
</html>`;

const HTML_BLANK_CSS = ``;

const HTML_BLANK_JS = ``;

const HTML_LANDING_INDEX = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Modern Web App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <nav class="navbar">
    <div class="logo">🚀 AppCraft</div>
    <ul class="nav-links">
      <li><a href="#features">Features</a></li>
      <li><a href="#about">About</a></li>
    </ul>
  </nav>

  <header class="hero">
    <h1>Build Beautiful Web Interfaces</h1>
    <p>Empower your development with live code editing and instant previews.</p>
    <button id="cta-btn" class="btn">Get Started</button>
  </header>

  <section id="features" class="grid">
    <div class="card">
      <h3>⚡ Realtime Live Sync</h3>
      <p>Instant HTML, CSS, and JS updates render automatically.</p>
    </div>
    <div class="card">
      <h3>🖼️ Integrated Assets</h3>
      <p>Upload image assets directly into your project workspace.</p>
    </div>
  </section>

  <script src="script.js"><\/script>
</body>
</html>`;

const HTML_LANDING_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; }

.navbar { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); }
.logo { font-size: 1.5rem; font-weight: bold; color: #38bdf8; }
.nav-links { display: flex; list-style: none; gap: 20px; }
.nav-links a { color: #94a3b8; text-decoration: none; font-weight: 500; }

.hero { text-align: center; padding: 80px 20px; }
.hero h1 { font-size: 2.5rem; color: #f8fafc; margin-bottom: 16px; }
.hero p { font-size: 1.1rem; color: #94a3b8; max-width: 600px; margin: 0 auto 24px; }

.btn { background: #38bdf8; color: #0f172a; border: none; padding: 12px 28px; font-size: 1rem; font-weight: bold; border-radius: 25px; cursor: pointer; transition: transform 0.2s; }
.btn:hover { transform: scale(1.05); }

.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; max-width: 900px; margin: 0 auto; padding: 40px 20px; }
.card { background: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155; }
.card h3 { color: #38bdf8; margin-bottom: 8px; }`;

const HTML_LANDING_JS = `document.getElementById('cta-btn')?.addEventListener('click', () => {
  alert('Welcome to Modern Web App!');
});`;

const HTML_GALLERY_INDEX = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Photo Portfolio</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>📸 Digital Showcase</h1>
    <p>Explore creative projects and image assets in Code Lab.</p>
  </header>

  <main class="gallery-grid">
    <div class="gallery-card">
      <img src="sample1.png" alt="Sample 1">
      <div class="card-caption">
        <h4>Creative Concept</h4>
        <p>Vector Art Concept</p>
      </div>
    </div>
    <div class="gallery-card">
      <img src="sample2.png" alt="Sample 2">
      <div class="card-caption">
        <h4>UI Mockup</h4>
        <p>Design Layout</p>
      </div>
    </div>
  </main>
  <script src="script.js"><\/script>
</body>
</html>`;

const HTML_GALLERY_CSS = `body { font-family: 'Segoe UI', sans-serif; background: #121827; color: #fff; margin: 0; padding: 40px; }
header { text-align: center; margin-bottom: 40px; }
header h1 { color: #a855f7; }
header p { color: #9ca3af; }

.gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; max-width: 800px; margin: 0 auto; }
.gallery-card { background: #1f2937; border-radius: 12px; overflow: hidden; border: 1px solid #374151; transition: transform 0.3s ease; }
.gallery-card:hover { transform: translateY(-5px); }
.gallery-card img { width: 100%; height: 180px; object-fit: cover; display: block; }
.card-caption { padding: 16px; }
.card-caption h4 { margin: 0 0 4px 0; color: #e5e7eb; }
.card-caption p { margin: 0; color: #9ca3af; font-size: 0.85rem; }`;

const HTML_GALLERY_JS = `console.log("Gallery Loaded");`;

const HTML_APP_INDEX = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Interactive JS App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app-card">
    <h2>Interactive Counter</h2>
    <div class="counter-display" id="count">0</div>
    <div class="btn-group">
      <button class="btn btn-sub" id="btn-dec">-</button>
      <button class="btn btn-reset" id="btn-reset">Reset</button>
      <button class="btn btn-add" id="btn-inc">+</button>
    </div>
  </div>
  <script src="script.js"><\/script>
</body>
</html>`;

const HTML_APP_CSS = `body { font-family: sans-serif; background: #090d16; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
.app-card { background: #151c2c; padding: 40px; border-radius: 16px; text-align: center; border: 1px solid rgba(255,255,255,0.1); width: 320px; }
.counter-display { font-size: 4rem; font-weight: bold; color: #60a5fa; margin: 20px 0; }
.btn-group { display: flex; gap: 10px; justify-content: center; }
.btn { border: none; padding: 10px 20px; font-size: 1.2rem; border-radius: 8px; cursor: pointer; color: white; }
.btn-sub { background: #ef4444; }
.btn-reset { background: #6b7280; font-size: 0.9rem; }
.btn-add { background: #10b981; }`;

const HTML_APP_JS = `let count = 0;
const countEl = document.getElementById('count');
document.getElementById('btn-inc')?.addEventListener('click', () => { count++; if(countEl) countEl.innerText = count; });
document.getElementById('btn-dec')?.addEventListener('click', () => { count--; if(countEl) countEl.innerText = count; });
document.getElementById('btn-reset')?.addEventListener('click', () => { count = 0; if(countEl) countEl.innerText = count; });`;

const SAMPLE_SVG_IMAGE_1 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%236366f1'/><circle cx='200' cy='150' r='80' fill='%23818cf8'/><text x='50%' y='50%' fill='white' font-family='sans-serif' font-size='24' text-anchor='middle' dy='.3em'>Creative Concept</text></svg>";

const SAMPLE_SVG_IMAGE_2 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23ec4899'/><polygon points='200,50 320,250 80,250' fill='%23f472b6'/><text x='50%' y='65%' fill='white' font-family='sans-serif' font-size='24' text-anchor='middle' dy='.3em'>UI Mockup</text></svg>";

const initHtmlProject = () => {
  const name = htmlWizardProjName.value.trim();
  if (!name) {
    $q.notify({ type: 'negative', message: 'Project Name is required.' });
    return;
  }

  htmlProjectName.value = name;
  htmlWizardProjName.value = name;
  localStorage.setItem(getStorageKey('sms_lab_active_html_project'), name);

  const files = [];
  const images = [];

  if (htmlSelectedTemplate.value === 'landing') {
    files.push(
      { name: 'index.html', code: HTML_LANDING_INDEX },
      { name: 'style.css', code: HTML_LANDING_CSS },
      { name: 'script.js', code: HTML_LANDING_JS }
    );
  } else if (htmlSelectedTemplate.value === 'gallery') {
    files.push(
      { name: 'index.html', code: HTML_GALLERY_INDEX },
      { name: 'style.css', code: HTML_GALLERY_CSS },
      { name: 'script.js', code: HTML_GALLERY_JS }
    );
    images.push(
      { name: 'sample1.png', url: SAMPLE_SVG_IMAGE_1, size: '2 KB', type: 'image/svg+xml' },
      { name: 'sample2.png', url: SAMPLE_SVG_IMAGE_2, size: '2 KB', type: 'image/svg+xml' }
    );
  } else if (htmlSelectedTemplate.value === 'app') {
    files.push(
      { name: 'index.html', code: HTML_APP_INDEX },
      { name: 'style.css', code: HTML_APP_CSS },
      { name: 'script.js', code: HTML_APP_JS }
    );
  } else {
    // Blank template
    files.push(
      { name: 'index.html', code: HTML_BLANK_INDEX },
      { name: 'style.css', code: HTML_BLANK_CSS },
      { name: 'script.js', code: HTML_BLANK_JS }
    );
  }

  htmlFiles.value = files;
  htmlImages.value = images;
  activeHtmlFileIndex.value = 0;

  saveCode(JSON.stringify({ projectName: htmlProjectName.value, files: htmlFiles.value, images: htmlImages.value }), 'html');
};

const resetHtmlProject = () => {
  if (confirm('Are you sure you want to reset the current HTML project? This will delete all custom files and uploaded images.')) {
    htmlProjectName.value = '';
    htmlWizardProjName.value = '';
    htmlFiles.value = [{ name: 'index.html', code: '' }];
    htmlImages.value = [];
    activeHtmlFileIndex.value = 0;
    saveCode(JSON.stringify({ projectName: '', files: htmlFiles.value, images: [] }), 'html');
  }
};

const createNewHtmlProject = () => {
  htmlProjectName.value = '';
  htmlWizardProjName.value = '';
  htmlSelectedTemplate.value = 'blank';
  htmlFiles.value = [{ name: 'index.html', code: '' }];
  htmlImages.value = [];
  activeHtmlFileIndex.value = 0;
};

const openNewHtmlFileDialog = () => {
  newHtmlFileName.value = '';
  newHtmlFileType.value = 'html';
  showNewHtmlFileDialog.value = true;
};

const createNewHtmlFile = () => {
  let name = newHtmlFileName.value.trim();
  if (!name) {
    $q.notify({ type: 'negative', message: 'File name is required.' });
    return;
  }
  const ext = '.' + newHtmlFileType.value;
  if (!name.toLowerCase().endsWith(ext)) {
    name += ext;
  }
  if (htmlFiles.value.some(f => f.name.toLowerCase() === name.toLowerCase())) {
    $q.notify({ type: 'negative', message: `File "${name}" already exists.` });
    return;
  }
  
  htmlFiles.value.push({ name, code: '' });
  activeHtmlFileIndex.value = htmlFiles.value.length - 1;
  saveCode(JSON.stringify({ projectName: htmlProjectName.value, files: htmlFiles.value, images: htmlImages.value }), 'html');
  showNewHtmlFileDialog.value = false;
  $q.notify({ type: 'positive', message: `Created file ${name}` });
};

const deleteHtmlFile = (idx) => {
  const file = htmlFiles.value[idx];
  if (file && confirm(`Are you sure you want to delete ${file.name}?`)) {
    htmlFiles.value.splice(idx, 1);
    if (activeHtmlFileIndex.value >= htmlFiles.value.length) {
      activeHtmlFileIndex.value = 0;
    }
    saveCode(JSON.stringify({ projectName: htmlProjectName.value, files: htmlFiles.value, images: htmlImages.value }), 'html');
  }
};

const triggerImageUpload = () => {
  if (imageFileInput.value) {
    imageFileInput.value.click();
  }
};

const uploadHtmlImage = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    $q.notify({ type: 'negative', message: 'Image size exceeds 5MB limit.' });
    return;
  }

  const reader = new FileReader();
  reader.onload = (evt) => {
    const dataUrl = evt.target.result;
    const name = file.name;
    const formattedSize = (file.size / 1024).toFixed(1) + ' KB';

    const existingIdx = htmlImages.value.findIndex(img => img.name.toLowerCase() === name.toLowerCase());
    if (existingIdx !== -1) {
      htmlImages.value.splice(existingIdx, 1);
    }

    htmlImages.value.push({
      name,
      url: dataUrl,
      size: formattedSize,
      type: file.type
    });

    saveCode(JSON.stringify({ projectName: htmlProjectName.value, files: htmlFiles.value, images: htmlImages.value }), 'html');
    $q.notify({ type: 'positive', message: `Uploaded image ${name}` });
  };
  reader.readAsDataURL(file);
  e.target.value = '';
};

const addHtmlImageByUrl = () => {
  const name = newImageUrlName.value.trim();
  const url = newImageUrlSrc.value.trim();

  if (!name || !url) {
    $q.notify({ type: 'negative', message: 'Image name and URL are required.' });
    return;
  }

  const existingIdx = htmlImages.value.findIndex(img => img.name.toLowerCase() === name.toLowerCase());
  if (existingIdx !== -1) {
    htmlImages.value.splice(existingIdx, 1);
  }

  htmlImages.value.push({
    name,
    url,
    size: 'Remote URL',
    type: 'image/external'
  });

  saveCode(JSON.stringify({ projectName: htmlProjectName.value, files: htmlFiles.value, images: htmlImages.value }), 'html');
  showAddImageUrlDialog.value = false;
  newImageUrlName.value = '';
  newImageUrlSrc.value = '';
  $q.notify({ type: 'positive', message: `Added image asset ${name}` });
};

const copyImgTag = (imgName) => {
  if (!imgName) return;
  const tag = `<img src="${imgName}" alt="${imgName.split('.')[0]}">`;
  navigator.clipboard.writeText(tag).then(() => {
    $q.notify({ type: 'positive', icon: 'content_copy', message: `Copied ${tag} to clipboard!`, position: 'top', timeout: 2000 });
  }).catch(() => {
    $q.notify({ type: 'negative', message: 'Failed to copy to clipboard' });
  });
};

const deleteHtmlImage = (idx) => {
  const img = htmlImages.value[idx];
  if (img && confirm(`Delete image ${img.name}?`)) {
    htmlImages.value.splice(idx, 1);
    saveCode(JSON.stringify({ projectName: htmlProjectName.value, files: htmlFiles.value, images: htmlImages.value }), 'html');
  }
};

const viewImageDetail = (img) => {
  selectedImageForView.value = img;
  showImageModal.value = true;
};

const addSqlFile = () => {
  const name = prompt('Enter new database file name (e.g. employees.db, inventory.sqlite)');
  if (name) {
    if (sqlEditorRef.value) {
      const dbBuffer = sqlEditorRef.value.exportDatabase();
      if (dbBuffer) {
        sqlFiles.value[activeSqlFileIndex.value].buffer = dbBuffer;
      }
    }
    sqlFiles.value.push({ name: name.endsWith('.db') || name.endsWith('.sqlite') ? name : name + '.db', code: '', buffer: null });
    activeSqlFileIndex.value = activeSqlFileIndex.value = sqlFiles.value.length - 1;
    saveCode(JSON.stringify(sqlFiles.value.map(f => ({ name: f.name, code: f.code }))), 'sql');
    if (!assignmentId.value) {
      scheduleSilentCloudSync();
    }
  }
};

const downloadSqlFile = () => {
  const currentFile = sqlFiles.value[activeSqlFileIndex.value];
  const code = currentFile?.code?.trim() || '';

  const studentName = authStore.user?.name || 'Unknown Student';
  const studentId   = authStore.user?.id   || 'N/A';
  const fileName    = currentFile?.name?.replace(/\.(db|sqlite)$/i, '') || 'query';
  const now         = new Date().toLocaleString();
  const assignTitle = assignment.value?.title || 'Free Play';

  const header = [
    `-- ============================================================`,
    `-- Student Name : ${studentName}`,
    `-- Student ID   : ${studentId}`,
    `-- Assignment   : ${assignTitle}`,
    `-- File         : ${fileName}.sql`,
    `-- Downloaded   : ${now}`,
    `-- ============================================================`,
    ``,
  ].join('\n');

  const content = header + code;

  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${studentName.replace(/\s+/g, '_')}_${fileName}.sql`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  $q.notify({ type: 'positive', icon: 'download', message: `Downloaded ${a.download}`, position: 'top', timeout: 2000 });
};

const changeActiveSqlFile = (idx) => {
  if (sqlEditorRef.value) {
    const dbBuffer = sqlEditorRef.value.exportDatabase();
    if (dbBuffer) {
      sqlFiles.value[activeSqlFileIndex.value].buffer = dbBuffer;
    }
  }
  activeSqlFileIndex.value = idx;
};

const handleJavaChange = (newCode) => {
  if (activeTab.value !== 'java') return;
  const currentFile = javaFiles.value[activeJavaFileIndex.value];
  if (currentFile && currentFile.code !== newCode) {
    currentFile.code = newCode;
    saveCode(JSON.stringify({
      projectName: projectName.value,
      files: javaFiles.value
    }), 'java');
  }
};

const handleHtmlChange = (newCode) => {
  if (activeTab.value !== 'html') return;
  const currentFile = htmlFiles.value[activeHtmlFileIndex.value];
  if (currentFile && currentFile.code !== newCode) {
    currentFile.code = newCode;
    saveCode(JSON.stringify({
      projectName: htmlProjectName.value,
      files: htmlFiles.value,
      images: htmlImages.value
    }), 'html');
  }
};

const handleSqlChange = (newCode) => {
  if (activeTab.value !== 'sql') return;
  const currentFile = sqlFiles.value[activeSqlFileIndex.value];
  if (currentFile && currentFile.code !== newCode) {
    currentFile.code = newCode;
    saveCode(JSON.stringify(sqlFiles.value.map(f => ({ name: f.name, code: f.code }))), 'sql');
    // Silently sync to cloud (only free-play, not assignment mode)
    if (!assignmentId.value) {
      scheduleSilentCloudSync();
    }
  }
};

const getSubmissionPayload = (content) => {
  const payload = {
    assignment_id: assignmentId.value,
    content: content,
  };
  if (submissionFile.value) {
    payload.file = submissionFile.value;
  }
  if (activeTab.value === 'sql' && sqlEditorRef.value) {
    // Export active buffer before saving
    const dbBuffer = sqlEditorRef.value.exportDatabase();
    if (dbBuffer) {
      sqlFiles.value[activeSqlFileIndex.value].buffer = dbBuffer;
    }
    
    // Package all databases into JSON array
    const packagedDbs = sqlFiles.value.map(f => ({
      name: f.name,
      code: f.code,
      bufferBase64: f.buffer ? bufferToBase64(f.buffer) : null
    }));
    
    payload.db_file = new Blob([JSON.stringify(packagedDbs)], { type: 'application/json' });
  }
  return payload;
};

const saveCode = (newCode, lang) => {
  if (isTeacherMode.value) return; // Prevent overwriting student code
  if (isReadOnly.value) return;
  if (!assignmentId.value) {
    // Free play: save to local storage and sync to cloud
    saveStatus.value = 'Saving to local draft...';
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const key = (lang === 'java' && projectName.value)
        ? `sms_lab_freeplay_java_${projectName.value}`
        : (lang === 'html' && htmlProjectName.value)
        ? `sms_lab_freeplay_html_${htmlProjectName.value}`
        : `sms_lab_freeplay_${lang}`;
      localStorage.setItem(getStorageKey(key), newCode);
      saveStatus.value = 'Local draft saved';
      scheduleSilentCloudSync();
    }, 1000);
    return;
  }

  // Task mode: autosave as DRAFT
  if (saveTimeout) clearTimeout(saveTimeout);

  if (!isOnline.value) {
    saveStatus.value = 'Offline - saving changes locally...';
    saveTimeout = setTimeout(() => {
      localStorage.setItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`), newCode);
      localStorage.setItem(getStorageKey(`sms_assignment_cache_${assignmentId.value}`), newCode);
      saveStatus.value = 'Offline - saved locally';
    }, 1000);
    return;
  }

  saveStatus.value = 'Saving draft...';
  saveTimeout = setTimeout(async () => {
    try {
      await lmsStore.saveDraft(getSubmissionPayload(newCode));
      localStorage.removeItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`));
      localStorage.setItem(getStorageKey(`sms_assignment_cache_${assignmentId.value}`), newCode);
      saveStatus.value = 'All changes saved';
    } catch (err) {
      console.error(err);
      localStorage.setItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`), newCode);
      saveStatus.value = 'Offline - saved locally';
    }
  }, 2000);
};

const syncPendingDrafts = async () => {
  if (!assignmentId.value || !isOnline.value) return;
  const pendingCode = localStorage.getItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`));
  if (!pendingCode) return;

  saveStatus.value = 'Syncing offline changes...';
  try {
    await lmsStore.saveDraft(getSubmissionPayload(pendingCode));
    localStorage.removeItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`));
    saveStatus.value = 'All changes saved';
    $q.notify({
      type: 'positive',
      icon: 'sync',
      message: 'Offline changes synced successfully!',
      position: 'top',
      timeout: 2000,
    });
  } catch (err) {
    console.error('Failed to sync offline changes:', err);
    saveStatus.value = 'Offline - saved locally (sync failed)';
  }
};

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
  if (isOnline.value) {
    syncPendingDrafts();
    if (!assignmentId.value) {
      scheduleSilentCloudSync();
    }
  } else {
    saveStatus.value = 'Offline - saving changes locally';
  }
};

// ── Silent Cloud Sync ──────────────────────────────────────────────────────
// Operates only in free-play mode (no assignment). Debounced 3 s to batch changes.
let cloudSyncTimer = null;

const silentCloudSync = async () => {
  if (!isOnline.value || assignmentId.value) return;
  try {
    if (activeTab.value === 'sql') {
      if (sqlEditorRef.value) {
        const dbBuffer = sqlEditorRef.value.exportDatabase();
        if (dbBuffer) {
          sqlFiles.value[activeSqlFileIndex.value].buffer = dbBuffer;
        }
      }
      const payload = sqlFiles.value.map(f => ({
        db_name:  f.name,
        db_data:  f.buffer ? bufferToBase64(f.buffer) : null,
        sql_code: f.code || '',
      }));
      await sqlSandboxService.syncAll(payload);
    } else if (activeTab.value === 'java') {
      if (!projectName.value) return;
      const projectData = JSON.stringify({
        projectName: projectName.value,
        files: javaFiles.value
      });
      const res = await javaSandboxService.sync(projectName.value, projectData);
      if (res && res.data && res.data.data) {
        const synced = res.data.data;
        const idx = allJavaProjects.value.findIndex(p => p.project_name === synced.project_name);
        if (idx !== -1) {
          allJavaProjects.value[idx] = synced;
        } else {
          allJavaProjects.value.push(synced);
        }
      }
    } else if (activeTab.value === 'html') {
      if (!htmlProjectName.value) return;
      const projectData = JSON.stringify({
        projectName: htmlProjectName.value,
        files: htmlFiles.value,
        images: htmlImages.value
      });
      const res = await htmlSandboxService.sync(htmlProjectName.value, projectData);
      if (res && res.data && res.data.data) {
        const synced = res.data.data;
        const idx = allHtmlProjects.value.findIndex(p => p.project_name === synced.project_name);
        if (idx !== -1) {
          allHtmlProjects.value[idx] = synced;
        } else {
          allHtmlProjects.value.push(synced);
        }
      }
    }
  } catch (err) {
    console.error('Failed silent cloud sync:', err);
  }
};

const scheduleSilentCloudSync = () => {
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(silentCloudSync, 3000);
};




const handleSubmitCode = async () => {
  if (!assignmentId.value) return;
  const content = getActiveCode();
  if (!content || !content.trim()) {
    $q.notify({ type: 'warning', message: 'Please write some content before submitting.' });
    return;
  }

  $q.dialog({
    title: 'Confirm Submission',
    message: 'Are you sure you want to submit your assignment? You will not be able to edit it after submitting.',
    cancel: true,
    persistent: true,
    ok: {
      label: 'Submit',
      color: 'positive',
      unelevated: true,
      rounded: true
    },
    cancel: {
      label: 'Cancel',
      flat: true,
      color: 'grey-7',
      rounded: true
    }
  }).onOk(async () => {
    isSubmitting.value = true;
    try {
      await lmsStore.submitAssignment(getSubmissionPayload(content));
      localStorage.removeItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`));
      submissionStatus.value = 'submitted';
      $q.notify({
        type: 'positive',
        message: assignmentType.value === 'coding' ? 'Code submitted successfully!' : 'Assignment submitted successfully!',
        position: 'top',
      });
      router.push('/assignments');
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message || 'Failed to submit.' });
    } finally {
      isSubmitting.value = false;
    }
  });
};

const showSubmitToAssignmentDialog = ref(false);
const selectedSubmitAssignment = ref(null);
const pendingAssignments = ref([]);
const isLoadingAssignments = ref(false);

const openSubmitToAssignmentDialog = async () => {
  showSubmitToAssignmentDialog.value = true;
  selectedSubmitAssignment.value = null;
  isLoadingAssignments.value = true;
  try {
    const studentSecId = authStore.user?.profile?.section_id || 1;
    await lmsStore.fetchAssignments(studentSecId, true);
    await lmsStore.fetchStudentSubmissions(true); // Ensure submissions are fresh
    
    // Filter pending assignments (either not submitted or draft)
    const submittedIds = lmsStore.submissions
      .filter(s => s.status === 'submitted' || s.status === 'graded')
      .map(s => s.assignment_id);

    // Only show coding assignments that are not submitted
    pendingAssignments.value = lmsStore.assignments.filter(a => !submittedIds.includes(a.id) && a.type === 'coding');
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Failed to load assignments.' });
  } finally {
    isLoadingAssignments.value = false;
  }
};

const confirmSubmitToAssignment = () => {
  $q.dialog({
    title: 'Confirm Submission',
    message: 'Are you sure you want to submit your current code to this assignment? You will not be able to edit it after submitting.',
    cancel: true,
    persistent: true,
    ok: {
      label: 'Submit',
      color: 'positive',
      unelevated: true,
      rounded: true
    },
    cancel: {
      label: 'Cancel',
      flat: true,
      color: 'grey-7',
      rounded: true
    }
  }).onOk(async () => {
    isSubmitting.value = true;
    try {
      const content = getActiveCode();
      if (!content || !content.trim()) {
        $q.notify({ type: 'warning', message: 'Please write some content before submitting.' });
        isSubmitting.value = false;
        return;
      }
      
      const payload = {
        assignment_id: selectedSubmitAssignment.value,
        content: content,
      };
      
      if (activeTab.value === 'sql' && sqlEditorRef.value) {
        const dbBuffer = sqlEditorRef.value.exportDatabase();
        if (dbBuffer) {
          sqlFiles.value[activeSqlFileIndex.value].buffer = dbBuffer;
        }
        const packagedDbs = sqlFiles.value.map(f => ({
          name: f.name,
          code: f.code,
          bufferBase64: f.buffer ? bufferToBase64(f.buffer) : null
        }));
        payload.db_file = new Blob([JSON.stringify(packagedDbs)], { type: 'application/json' });
      }

      await lmsStore.submitAssignment(payload);
      showSubmitToAssignmentDialog.value = false;
      $q.notify({
        type: 'positive',
        message: 'Code submitted successfully!',
        position: 'top',
      });
      router.push('/assignments');
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message || 'Failed to submit.' });
    } finally {
      isSubmitting.value = false;
    }
  });
};

const parseHtmlPayload = (codeVal) => {
  if (!codeVal) {
    return { projectName: '', files: [{ name: 'index.html', code: '' }], images: [] };
  }
  try {
    const parsed = JSON.parse(codeVal);
    if (Array.isArray(parsed)) {
      return { projectName: 'My Web Project', files: parsed, images: [] };
    } else if (parsed && typeof parsed === 'object') {
      return {
        projectName: parsed.projectName || 'My Web Project',
        files: parsed.files || [{ name: 'index.html', code: '' }],
        images: parsed.images || []
      };
    }
  } catch {
    return { projectName: 'My Web Project', files: [{ name: 'index.html', code: codeVal }], images: [] };
  }
  return { projectName: '', files: [{ name: 'index.html', code: '' }], images: [] };
};

const parseJavaPayload = (codeVal) => {
  if (!codeVal) {
    return { projectName: '', files: [{ name: 'Main.java', code: '', pkg: 'com.myapp', type: 'class' }] };
  }
  try {
    const parsed = JSON.parse(codeVal);
    if (Array.isArray(parsed)) {
      return { projectName: 'My Java Project', files: parsed };
    } else if (parsed && typeof parsed === 'object') {
      return {
        projectName: parsed.projectName || 'My Java Project',
        files: parsed.files || [{ name: 'Main.java', code: '', pkg: 'com.myapp', type: 'class' }]
      };
    }
  } catch {
    return { projectName: 'My Java Project', files: [{ name: 'Main.java', code: codeVal, pkg: 'com.myapp', type: 'class' }] };
  }
  return { projectName: '', files: [{ name: 'Main.java', code: '', pkg: 'com.myapp', type: 'class' }] };
};

// Sync written changes if needed
watch(writtenResponse, (newVal) => {
  if (assignmentType.value === 'written') {
    saveCode(newVal, 'written');
  }
});

// Watch active tab in free play mode to load drafts correctly
watch(activeTab, (newTab) => {
  if (!assignmentId.value) {
    const activeProj = newTab === 'java'
      ? localStorage.getItem(getStorageKey('sms_lab_active_java_project'))
      : newTab === 'html'
      ? localStorage.getItem(getStorageKey('sms_lab_active_html_project'))
      : null;
    const key = activeProj
      ? `sms_lab_freeplay_${newTab}_${activeProj}`
      : `sms_lab_freeplay_${newTab}`;
    const draft = localStorage.getItem(getStorageKey(key));
    if (draft) {
      if (newTab === 'html') {
        const payload = parseHtmlPayload(draft);
        htmlProjectName.value = payload.projectName || activeProj;
        htmlFiles.value = payload.files;
        htmlImages.value = payload.images;
        activeHtmlFileIndex.value = 0;
      } else if (newTab === 'java') {
        const payload = parseJavaPayload(draft);
        projectName.value = payload.projectName || activeProj;
        javaFiles.value = payload.files;
        activeJavaFileIndex.value = 0;
      }
    } else {
      // Only reset if no project is already loaded — don't clobber a cloud restore in progress
      if (newTab === 'html' && !htmlProjectName.value) {
        htmlFiles.value = [{ name: 'index.html', code: '' }];
        htmlImages.value = [];
      } else if (newTab === 'java' && !projectName.value) {
        javaFiles.value = [{ name: 'Main.java', code: '' }];
      }
    }
    // Save active tab preference
    localStorage.setItem(getStorageKey('sms_lab_active_tab'), newTab);
  }
});

const resetState = () => {
  assignmentId.value = null;
  maxScore.value = 0;
  projectName.value = '';
  wizardProjName.value = '';
  javaFiles.value = [{ name: 'Main.java', code: '' }];
  htmlProjectName.value = '';
  htmlWizardProjName.value = '';
  htmlFiles.value = [{ name: 'index.html', code: '' }];
  htmlImages.value = [];
  sqlFiles.value = [{ name: 'main.db', code: '', buffer: null }];
  activeJavaFileIndex.value = 0;
  activeHtmlFileIndex.value = 0;
  activeSqlFileIndex.value = 0;
  writtenResponse.value = '';
  submissionStatus.value = null;
  saveStatus.value = 'All changes saved';
  activeTab.value = getFallbackTab('java');
};

const loadDraftsForCurrentUser = async () => {
  try {
    const res = await API.get('/settings/compilers');
    disabledCompilers.value = res.disabled || [];
  } catch (err) {
    console.error('Failed to load compiler settings:', err);
  }

  // Ensure activeTab is not disabled
  activeTab.value = getFallbackTab(activeTab.value);

  const setCodeByLanguage = (codeVal) => {
    const lang = getAssignmentLanguage(codeVal);
    if (lang === 'html') {
      const payload = parseHtmlPayload(codeVal);
      htmlProjectName.value = payload.projectName;
      htmlFiles.value = payload.files;
      htmlImages.value = payload.images;
      projectName.value = '';
      javaFiles.value = [{ name: 'Main.java', code: '' }];
      activeHtmlFileIndex.value = 0;
      activeTab.value = getFallbackTab('html');
    } else if (lang === 'sql') {
      try {
        const parsed = JSON.parse(codeVal);
        if (Array.isArray(parsed)) sqlFiles.value = parsed.map(f => ({ ...f, buffer: null }));
        else throw new Error();
      } catch {
        sqlFiles.value = [{ name: 'main.db', code: codeVal || '', buffer: null }];
      }
      projectName.value = '';
      javaFiles.value = [{ name: 'Main.java', code: '' }];
      htmlProjectName.value = '';
      htmlFiles.value = [{ name: 'index.html', code: '' }];
      htmlImages.value = [];
      activeSqlFileIndex.value = 0;
      activeTab.value = getFallbackTab('sql');
    } else {
      const payload = parseJavaPayload(codeVal);
      projectName.value = payload.projectName;
      javaFiles.value = payload.files;
      htmlFiles.value = [{ name: 'index.html', code: '' }];
      htmlImages.value = [];
      activeJavaFileIndex.value = 0;
      activeTab.value = getFallbackTab('java');
    }
  };

  if (route.query.submission_id) {
    isTeacherMode.value = true;
    teacherSubmissionId.value = parseInt(route.query.submission_id);
    assignmentId.value = parseInt(route.query.assignment_id);

    try {
      isLabLoading.value = true;
      const existing = await lmsStore.fetchSubmission(teacherSubmissionId.value);
      if (existing) {
        submissionStatus.value = existing.status;
        if (existing.file_path && !existing.file_path.includes('sql_dbs')) {
          existingSubmissionFilePath.value = existing.file_path;
        }
        const serverCode = existing.content || '';
        setCodeByLanguage(serverCode);
        saveStatus.value = 'Teacher View Mode - Read Only';
        
        if (activeTab.value === 'sql' && existing.file_path) {
          try {
            const arrayBuffer = await lmsService.downloadSubmissionFile(existing.id);
            const jsonStr = new TextDecoder('utf-8').decode(arrayBuffer);
            const parsedDbs = JSON.parse(jsonStr);
            if (Array.isArray(parsedDbs)) {
              sqlFiles.value = parsedDbs.map(db => ({
                name: db.name,
                code: db.code,
                buffer: db.bufferBase64 ? base64ToBuffer(db.bufferBase64) : null
              }));
            }
          } catch (e) {
            console.error("Failed to fetch sqlite db json", e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load student submission:', err);
    } finally {
      isLabLoading.value = false;
    }
    return; // Stop here, do not load drafts
  }

  if (route.query.assignment_id) {
    assignmentId.value = parseInt(route.query.assignment_id);
    maxScore.value = route.query.max_score || 100;

    const studentSecId = authStore.user?.profile?.section_id || 1;
    try {
      await lmsStore.fetchAssignments(studentSecId);
    } catch (err) {
      console.error(err);
    }

    // 1. Check local cache first
    const cachedCode = localStorage.getItem(getStorageKey(`sms_assignment_cache_${assignmentId.value}`));
    const pendingCode = localStorage.getItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`));
    if (pendingCode) {
      setCodeByLanguage(pendingCode);
      saveStatus.value = isOnline.value ? 'Syncing offline changes...' : 'Offline - saved locally';
      if (isOnline.value) {
        syncPendingDrafts();
      }
    } else if (cachedCode) {
      setCodeByLanguage(cachedCode);
      saveStatus.value = 'Loaded local draft';
    } else {
      // Set default tab based on metadata keywords if no cache exists
      const title = assignment.value?.title || '';
      const desc = assignment.value?.description || '';
      if (
        title.toLowerCase().includes('html') ||
        title.toLowerCase().includes('css') ||
        desc.toLowerCase().includes('html') ||
        desc.toLowerCase().includes('css')
      ) {
        activeTab.value = getFallbackTab('html');
      } else if (
        title.toLowerCase().includes('sql') ||
        desc.toLowerCase().includes('sql') ||
        desc.toLowerCase().includes('database')
      ) {
        activeTab.value = getFallbackTab('sql');
      } else {
        activeTab.value = getFallbackTab('java');
      }
    }

    // 2. Fetch from database to ensure sync
    if (isOnline.value) {
      try {
        await lmsStore.fetchStudentSubmissions();
        const existing = lmsStore.submissions.find(s => s.assignment_id === assignmentId.value);
        if (existing) {
          submissionStatus.value = existing.status;
          // check if it's not a sql db file path (which starts with submissions/sql_dbs)
          if (existing.file_path && !existing.file_path.includes('sql_dbs')) {
            existingSubmissionFilePath.value = existing.file_path;
          }
          if (!pendingCode) {
            const serverCode = existing.content || '';
            setCodeByLanguage(serverCode);
            localStorage.setItem(getStorageKey(`sms_assignment_cache_${assignmentId.value}`), serverCode);
            saveStatus.value = existing.status === 'draft' ? 'All changes saved' : 'Submitted';

            if (activeTab.value === 'sql' && existing.file_path) {
              try {
                const arrayBuffer = await lmsService.downloadSubmissionFile(existing.id);
                const jsonStr = new TextDecoder('utf-8').decode(arrayBuffer);
                const parsedDbs = JSON.parse(jsonStr);
                if (Array.isArray(parsedDbs)) {
                  sqlFiles.value = parsedDbs.map(db => ({
                    name: db.name,
                    code: db.code,
                    buffer: db.bufferBase64 ? base64ToBuffer(db.bufferBase64) : null
                  }));
                }
              } catch (e) {
                console.error("Failed to fetch sqlite db json", e);
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  } else {
    // ── Free-play mode ────────────────────────────────────────────────────────
    // Strategy:
    isLabLoading.value = true;
    //   1. Restore active tab from localStorage preference.
    //   2. Try to restore state from localStorage (fast, offline-capable).
    //   3. If localStorage has nothing for this project, fetch from cloud and
    //      restore from there (awaited inline so the wizard never flashes).
    //   4. Always populate allJavaProjects / allHtmlProjects from cloud so the
    //      project-switcher dropdown is populated even on a fresh device.

    const savedTab = localStorage.getItem(getStorageKey('sms_lab_active_tab'));
    if (savedTab && ['java', 'sql', 'html'].includes(savedTab)) {
      activeTab.value = getFallbackTab(savedTab);
    } else {
      activeTab.value = getFallbackTab('java');
    }

    const activeJavaProj = localStorage.getItem(getStorageKey('sms_lab_active_java_project'));
    const activeHtmlProj = localStorage.getItem(getStorageKey('sms_lab_active_html_project'));

    const javaDraft = activeJavaProj
      ? localStorage.getItem(getStorageKey(`sms_lab_freeplay_java_${activeJavaProj}`))
      : null;
    const htmlDraft = activeHtmlProj
      ? localStorage.getItem(getStorageKey(`sms_lab_freeplay_html_${activeHtmlProj}`))
      : null;
    const sqlDraft = localStorage.getItem(getStorageKey('sms_lab_freeplay_sql'));

    // ── 1. Apply whatever we have locally first (instant, no flash) ──────────
    if (activeTab.value === 'html') {
      if (htmlDraft) {
        const payload = parseHtmlPayload(htmlDraft);
        htmlProjectName.value = payload.projectName || activeHtmlProj;
        htmlFiles.value = payload.files;
        htmlImages.value = payload.images;
      }
      projectName.value = '';
      javaFiles.value = [{ name: 'Main.java', code: '' }];
      sqlFiles.value = [{ name: 'main.db', code: '', buffer: null }];
      activeHtmlFileIndex.value = 0;
    } else if (activeTab.value === 'sql') {
      if (sqlDraft) {
        try {
          const parsed = JSON.parse(sqlDraft);
          sqlFiles.value = parsed.map(f => ({ ...f, buffer: null }));
        } catch {
          sqlFiles.value = [{ name: 'main.db', code: sqlDraft, buffer: null }];
        }
      }
      projectName.value = '';
      htmlProjectName.value = '';
      htmlFiles.value = [{ name: 'index.html', code: '' }];
      htmlImages.value = [];
      javaFiles.value = [{ name: 'Main.java', code: '' }];
      activeSqlFileIndex.value = 0;
    } else {
      // java tab
      if (javaDraft) {
        const payload = parseJavaPayload(javaDraft);
        projectName.value = payload.projectName || activeJavaProj;
        javaFiles.value = payload.files;
      }
      htmlProjectName.value = '';
      htmlFiles.value = [{ name: 'index.html', code: '' }];
      htmlImages.value = [];
      sqlFiles.value = [{ name: 'main.db', code: '', buffer: null }];
      activeJavaFileIndex.value = 0;
    }

    // ── 2. Fetch cloud data (awaited inline) ─────────────────────────────────
    if (isOnline.value) {
      // Java cloud projects
      try {
        const javaCloudList = await javaSandboxService.fetch();
        if (javaCloudList && Array.isArray(javaCloudList) && javaCloudList.length > 0) {
          allJavaProjects.value = javaCloudList;

          // If local draft was missing, restore the last-active (or first) cloud project
          if (!javaDraft) {
            const lastActive = activeJavaProj || javaCloudList[0].project_name;
            const activeProj = javaCloudList.find(p => p.project_name === lastActive) || javaCloudList[0];
            if (activeProj && activeProj.project_data) {
              const parsed = JSON.parse(activeProj.project_data);
              if (parsed) {
                projectName.value = activeProj.project_name;
                wizardProjName.value = activeProj.project_name;
                javaFiles.value = parsed.files || parsed;
                activeJavaFileIndex.value = 0;
                localStorage.setItem(getStorageKey('sms_lab_active_java_project'), activeProj.project_name);
                localStorage.setItem(
                  getStorageKey(`sms_lab_freeplay_java_${activeProj.project_name}`),
                  JSON.stringify({ projectName: activeProj.project_name, files: javaFiles.value })
                );
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load Java sandbox from cloud:', err);
      }

      // HTML cloud projects
      try {
        const htmlCloudList = await htmlSandboxService.fetch();
        if (htmlCloudList && Array.isArray(htmlCloudList) && htmlCloudList.length > 0) {
          allHtmlProjects.value = htmlCloudList;

          if (!htmlDraft) {
            const lastActive = activeHtmlProj || htmlCloudList[0].project_name;
            const activeProj = htmlCloudList.find(p => p.project_name === lastActive) || htmlCloudList[0];
            if (activeProj && activeProj.project_data) {
              const parsed = JSON.parse(activeProj.project_data);
              if (parsed) {
                htmlProjectName.value = activeProj.project_name;
                htmlWizardProjName.value = activeProj.project_name;
                htmlFiles.value = parsed.files || [{ name: 'index.html', code: '' }];
                htmlImages.value = parsed.images || [];
                activeHtmlFileIndex.value = 0;
                localStorage.setItem(getStorageKey('sms_lab_active_html_project'), activeProj.project_name);
                localStorage.setItem(
                  getStorageKey(`sms_lab_freeplay_html_${activeProj.project_name}`),
                  JSON.stringify({ projectName: activeProj.project_name, files: htmlFiles.value, images: htmlImages.value })
                );
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load HTML sandbox from cloud:', err);
      }

      // SQL cloud databases
      try {
        const cloudDbs = await sqlSandboxService.fetchAll();
        if (cloudDbs && cloudDbs.length > 0 && !sqlDraft) {
          sqlFiles.value = cloudDbs.map(db => ({
            name: db.db_name,
            code: db.sql_code || '',
            buffer: db.db_data ? base64ToBuffer(db.db_data) : null,
          }));
          activeSqlFileIndex.value = 0;
        }
      } catch (err) {
        console.error('Failed to load SQL sandbox from cloud:', err);
      }
    }
    isLabLoading.value = false;
  }
};

// Guard flag – prevents two concurrent loadDraftsForCurrentUser runs from racing each other
let _draftsLoading = false;
const _loadDraftsGuarded = async () => {
  if (_draftsLoading) return;
  _draftsLoading = true;
  try {
    await loadDraftsForCurrentUser();
  } finally {
    _draftsLoading = false;
  }
};

// Watch for user changes to reset state and load the new user's drafts dynamically
watch(() => authStore.user, (newUser) => {
  resetState();
  if (newUser) {
    _loadDraftsGuarded();
  }
}, { immediate: true });

// Watch for assignment ID query parameter changes to prevent cross-contamination between different assignments
watch(() => route.query.assignment_id, (newId, oldId) => {
  if (newId !== oldId) {
    resetState();
    _loadDraftsGuarded();
  }
});

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  // Only call if the user watcher's immediate: true did NOT already run it
  // (it may not have run if authStore.user wasn't set during setup yet)
  if (authStore.user && !_draftsLoading) {
    _loadDraftsGuarded();
  }
});

const downloadSubmissionAttachment = async () => {
  try {
    $q.notify({ type: 'info', message: 'Downloading attachment...' });
    const existing = lmsStore.submissions.find(s => s.assignment_id === assignmentId.value);
    if (!existing || !existing.id) return;
    const arrayBuffer = await lmsService.downloadSubmissionFile(existing.id);
    const blob = new Blob([arrayBuffer]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = existing.file_path ? existing.file_path.split('/').pop() : `submission_attachment`; 
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to download attachment.' });
  }
};

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
  // Flush any pending cloud sync immediately on unmount
  if (cloudSyncTimer) {
    clearTimeout(cloudSyncTimer);
    silentCloudSync();
  }
});
</script>

<style scoped>
.editor-container {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: #1e1e1e;
  overflow: hidden;
}

.code-textarea {
  width: 100%;
  font-size: 14px;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  padding: 16px;
  outline: none;
  line-height: 1.5;
}

/* Java Project Explorer Styles */
.border-left-dashed {
  border-left: 1.5px dashed rgba(0, 0, 0, 0.15);
  margin-left: 10px;
}
.file-node-row {
  transition: all 0.2s ease;
  border-radius: 4px;
}
.file-node-row:hover {
  background: rgba(0, 0, 0, 0.05);
}
.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.template-card {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
}
.template-card .template-title {
  color: #0f172a;
}
.template-card .template-desc {
  color: #64748b;
}
.template-card:hover {
  border-color: #007aff;
  background: #f1f5f9;
  transform: translateY(-2px);
}
.template-card.active {
  border-color: #007aff;
  background: #eef6ff;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.25);
}
.template-card.active .template-title {
  color: #0055b3;
}
.template-card.active .template-desc {
  color: #334155;
}

/* Dark mode overrides */
.body--dark .border-left-dashed {
  border-left-color: rgba(255, 255, 255, 0.15);
}
.body--dark .file-node-row:hover {
  background: rgba(255, 255, 255, 0.08);
}
.body--dark .border-bottom {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}
.body--dark .template-card {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(255, 255, 255, 0.12);
}
.body--dark .template-card .template-title {
  color: #f8fafc;
}
.body--dark .template-card .template-desc {
  color: #94a3b8;
}
.body--dark .template-card:hover {
  border-color: #818cf8;
  background: rgba(99, 102, 241, 0.15);
}
.body--dark .template-card.active {
  border-color: #818cf8;
  background: rgba(99, 102, 241, 0.25);
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.4);
}

.project-explorer-card {
  min-height: 250px;
  display: flex;
  flex-direction: column;
}

.project-tree-container {
  flex: 1;
  max-height: 200px;
  overflow-y: auto;
}

@media (min-width: 1024px) {
  .project-explorer-card {
    min-height: 500px;
  }
  .project-tree-container {
    max-height: 400px;
  }
}
</style>
