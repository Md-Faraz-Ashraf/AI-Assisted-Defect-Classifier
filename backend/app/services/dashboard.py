from app.dependencies.container import AppContainer
from app.models.domain import DefectType
from app.schemas.api import DashboardSummary, DefectCount


class DashboardService:
    def __init__(self, container: AppContainer) -> None:
        self.container = container

    def summary(self) -> DashboardSummary:
        counts = self.container.inspection_repository.dashboard_counts()
        total = sum(counts.values())
        passed = counts[DefectType.NO_DEFECT]
        rejected = total - passed
        accepted = self.container.inspection_repository.dashboard_accepted_count()
        return DashboardSummary(
            total_inspections=total,
            passed_inspections=passed,
            rejected_inspections=rejected,
            defect_rate=round(rejected / total * 100, 2) if total else 0,
            ai_acceptance_rate=round(accepted / total * 100, 2) if total else 0,
            defect_breakdown=[
                DefectCount(defect_type=kind, count=counts[kind]) for kind in DefectType
            ],
        )
