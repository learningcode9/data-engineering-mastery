import { memo, useState } from 'react';
import { projectDetails } from '../../data/projectDetails.js';
import { ProjectDetail } from './ProjectDetail.jsx';
import { AppCard, Badge, SectionHeader } from '../ui/design-system.jsx';

const DIFFICULTY_VARIANT = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'danger',
};

function ProjectCard({ project, onClick }) {
  const stepsCount  = project.steps?.length ?? 0;
  const layersCount = project.architecture?.layers?.length ?? 0;
  const firstTag    = project.tags?.[0];

  return (
    <AppCard
      as="button"
      type="button"
      interactive
      className={`project-card project-card--${project.difficulty.toLowerCase()}`}
      onClick={() => onClick(project)}
      aria-label={`Open project details for ${project.title}`}
    >
      <div className="project-card-header">
        <span className="project-card-icon">{project.icon}</span>
        <Badge
          className="project-card-difficulty"
          variant={DIFFICULTY_VARIANT[project.difficulty] ?? 'warning'}
          size="md"
        >
          {project.difficulty}
        </Badge>
      </div>
      <h3 className="project-card-title" title={project.title}>{project.title}</h3>
      <p className="project-card-overview" title={project.overview}>{project.overview}</p>
      <div className="project-metrics-row">
        {stepsCount > 0 && <span className="project-metric">◎ {stepsCount} steps</span>}
        {stepsCount > 0 && (layersCount > 0 || firstTag) && <span className="project-metric-sep">·</span>}
        {layersCount > 0 && <span className="project-metric">▫ {layersCount} layers</span>}
        {layersCount > 0 && firstTag && <span className="project-metric-sep">·</span>}
        {firstTag && <span className="project-metric-tag">{firstTag}</span>}
      </div>
      <div className="project-card-tools">
        {(project.tools ?? []).slice(0, 3).map(t => (
          <span key={t} className="project-tool-chip">{t}</span>
        ))}
        {(project.tools?.length ?? 0) > 3 && (
          <span className="project-tool-more">+{project.tools.length - 3}</span>
        )}
      </div>
      <div className="project-card-footer">
        <span className="project-card-duration">⏱ {project.duration}</span>
        <span className="project-card-open">Open →</span>
      </div>
    </AppCard>
  );
}

const Projects = memo(function Projects() {
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <>
      <section className="section" id="projects">
        <SectionHeader
          eyebrow="Portfolio"
          title="Real-World Projects"
          description="End-to-end data engineering projects with architecture, code, datasets, and resume bullet points."
          badge={<Badge variant="muted" size="lg">{projectDetails.length} projects</Badge>}
        />
        <div className="projects-grid">
          {projectDetails.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={setSelectedProject}
            />
          ))}
        </div>
      </section>

      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
});

export default Projects;
